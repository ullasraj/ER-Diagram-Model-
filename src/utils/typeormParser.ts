export interface ParsedColumn {
  id: string;
  name: string;
  dbName: string;
  type: string;
  tsType: string;
  isPrimary: boolean;
  isGenerated: boolean;
  isNullable: boolean;
  isUnique: boolean;
  isForeignKey: boolean;
  foreignKeyTarget?: {
    entityName: string;
    columnName: string;
    relationType: string;
  };
  defaultValue?: string;
  comment?: string;
}

export interface ParsedRelation {
  id: string;
  propertyName: string;
  relationType: 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';
  targetEntity: string;
  inverseProperty?: string;
  fkColumnName?: string;
  joinTableName?: string;
  isOwner: boolean;
  onDelete?: string;
  onUpdate?: string;
}

export interface ParsedEntity {
  id: string;
  fileName: string;
  className: string;
  tableName: string;
  columns: ParsedColumn[];
  relations: ParsedRelation[];
  rawCode: string;
}

export interface EntityRelationshipEdge {
  id: string;
  sourceEntity: string;
  sourceColumn?: string;
  targetEntity: string;
  targetColumn?: string;
  relationType: 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';
  cardinalityLabel: string; // e.g. "1 : N", "N : 1", "1 : 1", "N : M"
  sourceProperty: string;
  targetProperty?: string;
  joinTableName?: string;
}

/**
 * Main parser function to convert TypeORM entity files into structured schema metadata
 */
export function parseTypeORMEntities(
  files: { id: string; fileName: string; code: string }[]
): { entities: ParsedEntity[]; edges: EntityRelationshipEdge[]; errors: string[] } {
  const entities: ParsedEntity[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const parsed = parseSingleEntityFile(file.code, file.fileName, file.id);
      if (parsed) {
        entities.push(...parsed);
      }
    } catch (err: any) {
      errors.push(`Error parsing ${file.fileName}: ${err.message || String(err)}`);
    }
  }

  // Cross-link relations and generate foreign key columns if missing
  const edges = resolveEntityRelationships(entities);

  return { entities, edges, errors };
}

function parseSingleEntityFile(
  code: string,
  fileName: string,
  fileId: string
): ParsedEntity[] {
  const resultEntities: ParsedEntity[] = [];

  // Remove single line and multi-line comments for easier regex processing
  const cleanCode = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');

  // Regex to match class definitions with @Entity decorator
  // Matches optional @Entity(...) followed by optional other decorators and export class ClassName
  const classRegex = /(?:@Entity\s*\(\s*([\s\S]*?)\s*\)\s*)?(?:@[^\n]+\s*)*export\s+class\s+([A-Za-z0-9_]+)(?:[\s\S]*?)\{([\s\S]*?)\n\}/g;

  let match;
  while ((match = classRegex.exec(cleanCode)) !== null) {
    const entityDecoratorArgs = match[1] || '';
    const className = match[2];
    const classBody = match[3];

    // Table name extraction
    let tableName = className.toLowerCase();
    if (entityDecoratorArgs) {
      const nameMatch = entityDecoratorArgs.match(/['"`]([A-Za-z0-9_-]+)['"`]/);
      if (nameMatch) {
        tableName = nameMatch[1];
      } else {
        const objMatch = entityDecoratorArgs.match(/name\s*:\s*['"`]([A-Za-z0-9_-]+)['"`]/);
        if (objMatch) {
          tableName = objMatch[1];
        }
      }
    }

    const columns: ParsedColumn[] = [];
    const relations: ParsedRelation[] = [];

    // Parse class body line by line or property blocks
    // Match property declarations with their decorators
    const propRegex = /((?:@[A-Za-z0-9_]+\s*(?:\([\s\S]*?\))?\s*)+)\s*([A-Za-z0-9_]+)\s*(?:\?|\!)?\s*:\s*([A-Za-z0-9_<>\[\]|]+)(?:\s*=\s*[^;]+)?;/g;

    let propMatch;
    while ((propMatch = propRegex.exec(classBody)) !== null) {
      const decoratorsStr = propMatch[1];
      const propName = propMatch[2];
      const tsType = propMatch[3];

      // Process decorators for this property
      const decorators = parseDecorators(decoratorsStr);

      // Check if this property is a relation
      const relationDecorator = decorators.find((d) =>
        ['ManyToOne', 'OneToMany', 'OneToOne', 'ManyToMany'].includes(d.name)
      );

      if (relationDecorator) {
        // Relation processing
        const rel = parseRelationDecorator(
          relationDecorator,
          decorators,
          propName,
          tsType
        );
        if (rel) {
          relations.push(rel);
        }
      } else {
        // Column processing
        const col = parseColumnDecorators(decorators, propName, tsType);
        if (col) {
          columns.push(col);
        }
      }
    }

    resultEntities.push({
      id: `${fileId}-${className}`,
      fileName,
      className,
      tableName,
      columns,
      relations,
      rawCode: code,
    });
  }

  // Fallback: If no @Entity found but there is `export class ClassName`, try to parse class directly
  if (resultEntities.length === 0) {
    const fallbackClassRegex = /export\s+class\s+([A-Za-z0-9_]+)(?:[\s\S]*?)\{([\s\S]*?)\n\}/g;
    let fbMatch;
    while ((fbMatch = fallbackClassRegex.exec(cleanCode)) !== null) {
      const className = fbMatch[1];
      const classBody = fbMatch[2];
      const columns: ParsedColumn[] = [];
      const relations: ParsedRelation[] = [];

      const propRegex = /((?:@[A-Za-z0-9_]+\s*(?:\([\s\S]*?\))?\s*)+)\s*([A-Za-z0-9_]+)\s*(?:\?|\!)?\s*:\s*([A-Za-z0-9_<>\[\]|]+)(?:\s*=\s*[^;]+)?;/g;
      let propMatch;
      while ((propMatch = propRegex.exec(classBody)) !== null) {
        const decoratorsStr = propMatch[1];
        const propName = propMatch[2];
        const tsType = propMatch[3];

        const decorators = parseDecorators(decoratorsStr);
        const relationDecorator = decorators.find((d) =>
          ['ManyToOne', 'OneToMany', 'OneToOne', 'ManyToMany'].includes(d.name)
        );

        if (relationDecorator) {
          const rel = parseRelationDecorator(
            relationDecorator,
            decorators,
            propName,
            tsType
          );
          if (rel) relations.push(rel);
        } else {
          const col = parseColumnDecorators(decorators, propName, tsType);
          if (col) columns.push(col);
        }
      }

      resultEntities.push({
        id: `${fileId}-${className}`,
        fileName,
        className,
        tableName: className.toLowerCase(),
        columns,
        relations,
        rawCode: code,
      });
    }
  }

  return resultEntities;
}

interface ParsedDecorator {
  name: string;
  argsStr: string;
}

function parseDecorators(decoratorsStr: string): ParsedDecorator[] {
  const list: ParsedDecorator[] = [];
  const regex = /@([A-Za-z0-9_]+)(?:\s*\(([\s\S]*?)\))?/g;
  let match;
  while ((match = regex.exec(decoratorsStr)) !== null) {
    list.push({
      name: match[1],
      argsStr: match[2] || '',
    });
  }
  return list;
}

function parseColumnDecorators(
  decorators: ParsedDecorator[],
  propName: string,
  tsType: string
): ParsedColumn | null {
  const columnDec = decorators.find((d) =>
    [
      'Column',
      'PrimaryColumn',
      'PrimaryGeneratedColumn',
      'CreateDateColumn',
      'UpdateDateColumn',
      'DeleteDateColumn',
      'VersionColumn',
      'ObjectIdColumn',
    ].includes(d.name)
  );

  if (!columnDec && !decorators.some((d) => d.name.includes('Column'))) {
    return null; // Not a column
  }

  const decName = columnDec ? columnDec.name : 'Column';
  const argsStr = columnDec ? columnDec.argsStr : '';

  let isPrimary =
    decName === 'PrimaryColumn' || decName === 'PrimaryGeneratedColumn';
  let isGenerated = decName === 'PrimaryGeneratedColumn';
  let isNullable = false;
  let isUnique = false;
  let dbName = propName;
  let dbType = mapTsTypeToDbType(tsType);
  let defaultValue: string | undefined = undefined;

  // Inspect arguments inside decorator, e.g., @Column({ type: 'varchar', name: 'user_name', nullable: true })
  if (argsStr) {
    // Type string argument directly: @Column('varchar') or @PrimaryGeneratedColumn('uuid')
    const directTypeMatch = argsStr.match(/^['"`]([A-Za-z0-9_\s()]+)['"`]/);
    if (directTypeMatch) {
      dbType = directTypeMatch[1];
    }

    // Object options check
    if (argsStr.includes('{')) {
      const typeMatch = argsStr.match(/type\s*:\s*['"`]?([A-Za-z0-9_\s()]+)['"`]?/);
      if (typeMatch) dbType = typeMatch[1];

      const nameMatch = argsStr.match(/name\s*:\s*['"`]([A-Za-z0-9_-]+)['"`]/);
      if (nameMatch) dbName = nameMatch[1];

      if (/nullable\s*:\s*true/.test(argsStr)) isNullable = true;
      if (/unique\s*:\s*true/.test(argsStr)) isUnique = true;
      if (/primary\s*:\s*true/.test(argsStr)) isPrimary = true;

      const defaultMatch = argsStr.match(/default\s*:\s*([^,}]+)/);
      if (defaultMatch) defaultValue = defaultMatch[1].trim().replace(/['"`]/g, '');
    }
  }

  // Special date column types
  if (decName === 'CreateDateColumn' || decName === 'UpdateDateColumn' || decName === 'DeleteDateColumn') {
    dbType = 'timestamp';
    if (decName === 'DeleteDateColumn') isNullable = true;
  }

  return {
    id: `${propName}-${Math.random().toString(36).substring(2, 7)}`,
    name: propName,
    dbName,
    type: dbType,
    tsType,
    isPrimary,
    isGenerated,
    isNullable,
    isUnique,
    isForeignKey: false,
    defaultValue,
  };
}

function parseRelationDecorator(
  relationDec: ParsedDecorator,
  decorators: ParsedDecorator[],
  propName: string,
  tsType: string
): ParsedRelation | null {
  const relationType = relationDec.name as ParsedRelation['relationType'];
  const argsStr = relationDec.argsStr;

  let targetEntity = tsType.replace(/[\[\]\<\>]/g, '').trim();
  let inverseProperty: string | undefined = undefined;

  // Extract target entity function e.g., () => User, (user) => user.posts
  if (argsStr) {
    const arrowFnMatches = Array.from(
      argsStr.matchAll(/\(\)\s*=>\s*([A-Za-z0-9_]+)|type\s*=>\s*([A-Za-z0-9_]+)/g)
    );
    if (arrowFnMatches.length > 0 && (arrowFnMatches[0][1] || arrowFnMatches[0][2])) {
      targetEntity = arrowFnMatches[0][1] || arrowFnMatches[0][2];
    }

    const inverseMatch = argsStr.match(/\([A-Za-z0-9_]+\)\s*=>\s*[A-Za-z0-9_]+\.([A-Za-z0-9_]+)/);
    if (inverseMatch) {
      inverseProperty = inverseMatch[1];
    }
  }

  const joinColumnDec = decorators.find((d) => d.name === 'JoinColumn');
  const joinTableDec = decorators.find((d) => d.name === 'JoinTable');

  let fkColumnName: string | undefined = undefined;
  if (joinColumnDec && joinColumnDec.argsStr) {
    const nameMatch = joinColumnDec.argsStr.match(/name\s*:\s*['"`]([A-Za-z0-9_-]+)['"`]/);
    if (nameMatch) {
      fkColumnName = nameMatch[1];
    }
  }

  if (relationType === 'ManyToOne' && !fkColumnName) {
    fkColumnName = `${propName}Id`;
  }

  let joinTableName: string | undefined = undefined;
  if (joinTableDec && joinTableDec.argsStr) {
    const tableMatch = joinTableDec.argsStr.match(/name\s*:\s*['"`]([A-Za-z0-9_-]+)['"`]/);
    if (tableMatch) {
      joinTableName = tableMatch[1];
    }
  }

  return {
    id: `${propName}-${Math.random().toString(36).substring(2, 7)}`,
    propertyName: propName,
    relationType,
    targetEntity,
    inverseProperty,
    fkColumnName,
    joinTableName,
    isOwner: !!joinColumnDec || !!joinTableDec || relationType === 'ManyToOne',
  };
}

function mapTsTypeToDbType(tsType: string): string {
  const lower = tsType.toLowerCase();
  if (lower.includes('number')) return 'integer';
  if (lower.includes('string')) return 'varchar';
  if (lower.includes('boolean')) return 'boolean';
  if (lower.includes('date')) return 'timestamp';
  if (lower.includes('object') || lower.includes('json') || lower.includes('[]')) return 'jsonb';
  return tsType;
}

/**
 * Cross-references parsed entities to resolve relationship edges and generate FK columns
 */
function resolveEntityRelationships(entities: ParsedEntity[]): EntityRelationshipEdge[] {
  const edges: EntityRelationshipEdge[] = [];
  const entityMap = new Map<string, ParsedEntity>();

  entities.forEach((ent) => {
    entityMap.set(ent.className, ent);
  });

  entities.forEach((sourceEntity) => {
    sourceEntity.relations.forEach((rel) => {
      const targetEntity = entityMap.get(rel.targetEntity);

      if (rel.relationType === 'ManyToOne') {
        // ManyToOne creates a Foreign Key in source table pointing to target table
        const fkColName = rel.fkColumnName || `${rel.propertyName}Id`;
        let existingCol = sourceEntity.columns.find(
          (c) => c.name === fkColName || c.dbName === fkColName
        );

        if (!existingCol) {
          // Auto create foreign key column representation
          existingCol = {
            id: `fk-${sourceEntity.className}-${fkColName}`,
            name: fkColName,
            dbName: fkColName,
            type: targetEntity
              ? targetEntity.columns.find((c) => c.isPrimary)?.type || 'integer'
              : 'integer',
            tsType: 'number',
            isPrimary: false,
            isGenerated: false,
            isNullable: true,
            isUnique: false,
            isForeignKey: true,
            foreignKeyTarget: {
              entityName: rel.targetEntity,
              columnName: targetEntity?.columns.find((c) => c.isPrimary)?.dbName || 'id',
              relationType: 'ManyToOne',
            },
          };
          sourceEntity.columns.push(existingCol);
        } else {
          existingCol.isForeignKey = true;
          existingCol.foreignKeyTarget = {
            entityName: rel.targetEntity,
            columnName: targetEntity?.columns.find((c) => c.isPrimary)?.dbName || 'id',
            relationType: 'ManyToOne',
          };
        }

        edges.push({
          id: `edge-${sourceEntity.className}-${rel.propertyName}-${rel.targetEntity}`,
          sourceEntity: sourceEntity.className,
          sourceColumn: fkColName,
          targetEntity: rel.targetEntity,
          targetColumn: targetEntity?.columns.find((c) => c.isPrimary)?.dbName || 'id',
          relationType: 'ManyToOne',
          cardinalityLabel: 'N : 1',
          sourceProperty: rel.propertyName,
          targetProperty: rel.inverseProperty,
        });
      } else if (rel.relationType === 'OneToMany') {
        // OneToMany is inverse side of ManyToOne
        // Only add edge if inverse edge isn't already added to prevent duplicate visual lines
        const hasExistingManyToOne = edges.some(
          (e) =>
            e.sourceEntity === rel.targetEntity &&
            e.targetEntity === sourceEntity.className &&
            e.relationType === 'ManyToOne'
        );

        if (!hasExistingManyToOne) {
          edges.push({
            id: `edge-${sourceEntity.className}-${rel.propertyName}-${rel.targetEntity}`,
            sourceEntity: sourceEntity.className,
            sourceColumn: sourceEntity.columns.find((c) => c.isPrimary)?.dbName || 'id',
            targetEntity: rel.targetEntity,
            targetColumn: `${rel.inverseProperty || sourceEntity.className.toLowerCase()}Id`,
            relationType: 'OneToMany',
            cardinalityLabel: '1 : N',
            sourceProperty: rel.propertyName,
            targetProperty: rel.inverseProperty,
          });
        }
      } else if (rel.relationType === 'OneToOne') {
        const isOwner = rel.isOwner;
        const fkColName = rel.fkColumnName || `${rel.propertyName}Id`;

        if (isOwner) {
          let existingCol = sourceEntity.columns.find(
            (c) => c.name === fkColName || c.dbName === fkColName
          );
          if (!existingCol) {
            existingCol = {
              id: `fk-${sourceEntity.className}-${fkColName}`,
              name: fkColName,
              dbName: fkColName,
              type: targetEntity
                ? targetEntity.columns.find((c) => c.isPrimary)?.type || 'integer'
                : 'integer',
              tsType: 'number',
              isPrimary: false,
              isGenerated: false,
              isNullable: true,
              isUnique: true,
              isForeignKey: true,
              foreignKeyTarget: {
                entityName: rel.targetEntity,
                columnName: targetEntity?.columns.find((c) => c.isPrimary)?.dbName || 'id',
                relationType: 'OneToOne',
              },
            };
            sourceEntity.columns.push(existingCol);
          } else {
            existingCol.isForeignKey = true;
            existingCol.isUnique = true;
          }
        }

        const edgeExists = edges.some(
          (e) =>
            (e.sourceEntity === sourceEntity.className && e.targetEntity === rel.targetEntity) ||
            (e.sourceEntity === rel.targetEntity && e.targetEntity === sourceEntity.className)
        );

        if (!edgeExists) {
          edges.push({
            id: `edge-${sourceEntity.className}-${rel.propertyName}-${rel.targetEntity}`,
            sourceEntity: sourceEntity.className,
            sourceColumn: fkColName,
            targetEntity: rel.targetEntity,
            targetColumn: targetEntity?.columns.find((c) => c.isPrimary)?.dbName || 'id',
            relationType: 'OneToOne',
            cardinalityLabel: '1 : 1',
            sourceProperty: rel.propertyName,
            targetProperty: rel.inverseProperty,
          });
        }
      } else if (rel.relationType === 'ManyToMany') {
        const edgeExists = edges.some(
          (e) =>
            (e.sourceEntity === sourceEntity.className && e.targetEntity === rel.targetEntity) ||
            (e.sourceEntity === rel.targetEntity && e.targetEntity === sourceEntity.className)
        );

        if (!edgeExists) {
          const joinTable =
            rel.joinTableName ||
            `${sourceEntity.tableName}_${(rel.targetEntity).toLowerCase()}`;

          edges.push({
            id: `edge-${sourceEntity.className}-${rel.propertyName}-${rel.targetEntity}`,
            sourceEntity: sourceEntity.className,
            targetEntity: rel.targetEntity,
            relationType: 'ManyToMany',
            cardinalityLabel: 'N : M',
            sourceProperty: rel.propertyName,
            targetProperty: rel.inverseProperty,
            joinTableName: joinTable,
          });
        }
      }
    });
  });

  return edges;
}
