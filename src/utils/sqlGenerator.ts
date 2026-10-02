import type { ParsedEntity, EntityRelationshipEdge } from './typeormParser';

export type SqlDialect = 'postgresql' | 'mysql' | 'sqlite';

export function generateSqlDDL(
  entities: ParsedEntity[],
  edges: EntityRelationshipEdge[],
  dialect: SqlDialect = 'postgresql'
): string {
  if (entities.length === 0) {
    return '-- Upload TypeORM entities to generate SQL DDL';
  }

  const output: string[] = [
    `-- ===================================================`,
    `-- Generated SQL DDL Schema (${dialect.toUpperCase()})`,
    `-- Generated from TypeORM Entities`,
    `-- Date: ${new Date().toISOString().split('T')[0]}`,
    `-- ===================================================\n`,
  ];

  const foreignKeysSQL: string[] = [];

  entities.forEach((entity) => {
    output.push(`-- Table: ${entity.tableName} (Entity: ${entity.className})`);
    output.push(`CREATE TABLE ${quoteIdent(entity.tableName, dialect)} (`);

    const columnDefs: string[] = [];
    const pkCols: string[] = [];

    entity.columns.forEach((col) => {
      let colDef = `  ${quoteIdent(col.dbName, dialect)} ${mapSqlType(col.type, dialect)}`;

      if (col.isGenerated && dialect !== 'sqlite') {
        if (col.type.includes('uuid')) {
          if (dialect === 'postgresql') colDef += ' DEFAULT gen_random_uuid()';
        } else {
          if (dialect === 'postgresql') colDef = `  ${quoteIdent(col.dbName, dialect)} SERIAL`;
          if (dialect === 'mysql') colDef += ' AUTO_INCREMENT';
        }
      }

      if (col.isPrimary) {
        pkCols.push(quoteIdent(col.dbName, dialect));
      }

      if (!col.isNullable && !col.isPrimary) {
        colDef += ' NOT NULL';
      }

      if (col.isUnique && !col.isPrimary) {
        colDef += ' UNIQUE';
      }

      if (col.defaultValue !== undefined && col.defaultValue !== '') {
        colDef += ` DEFAULT ${formatSqlDefault(col.defaultValue)}`;
      }

      columnDefs.push(colDef);
    });

    if (pkCols.length > 0) {
      columnDefs.push(`  PRIMARY KEY (${pkCols.join(', ')})`);
    }

    output.push(columnDefs.join(',\n'));
    output.push(`);\n`);
  });

  // Foreign key constraints
  edges.forEach((edge) => {
    if (edge.relationType === 'ManyToOne' || edge.relationType === 'OneToOne') {
      const sourceEnt = entities.find((e) => e.className === edge.sourceEntity);
      const targetEnt = entities.find((e) => e.className === edge.targetEntity);

      if (sourceEnt && targetEnt && edge.sourceColumn) {
        const sourceTable = sourceEnt.tableName;
        const targetTable = targetEnt.tableName;
        const sourceCol = edge.sourceColumn;
        const targetCol = edge.targetColumn || 'id';

        const fkConstraintName = `fk_${sourceTable}_${sourceCol}`;
        foreignKeysSQL.push(
          `ALTER TABLE ${quoteIdent(sourceTable, dialect)} ADD CONSTRAINT ${quoteIdent(
            fkConstraintName,
            dialect
          )} FOREIGN KEY (${quoteIdent(sourceCol, dialect)}) REFERENCES ${quoteIdent(
            targetTable,
            dialect
          )} (${quoteIdent(targetCol, dialect)}) ON DELETE CASCADE;`
        );
      }
    } else if (edge.relationType === 'ManyToMany' && edge.joinTableName) {
      // Create junction table for ManyToMany
      const joinTable = edge.joinTableName;
      const sourceEnt = entities.find((e) => e.className === edge.sourceEntity);
      const targetEnt = entities.find((e) => e.className === edge.targetEntity);

      if (sourceEnt && targetEnt) {
        const sourceFk = `${sourceEnt.tableName}_id`;
        const targetFk = `${targetEnt.tableName}_id`;

        output.push(`-- Junction Table for ManyToMany: ${sourceEnt.className} <-> ${targetEnt.className}`);
        output.push(`CREATE TABLE ${quoteIdent(joinTable, dialect)} (`);
        output.push(`  ${quoteIdent(sourceFk, dialect)} ${mapSqlType('uuid', dialect)} NOT NULL,`);
        output.push(`  ${quoteIdent(targetFk, dialect)} ${mapSqlType('uuid', dialect)} NOT NULL,`);
        output.push(`  PRIMARY KEY (${quoteIdent(sourceFk, dialect)}, ${quoteIdent(targetFk, dialect)})`);
        output.push(`);\n`);

        foreignKeysSQL.push(
          `ALTER TABLE ${quoteIdent(joinTable, dialect)} ADD CONSTRAINT ${quoteIdent(
            `fk_${joinTable}_${sourceFk}`,
            dialect
          )} FOREIGN KEY (${quoteIdent(sourceFk, dialect)}) REFERENCES ${quoteIdent(
            sourceEnt.tableName,
            dialect
          )} (id) ON DELETE CASCADE;`
        );

        foreignKeysSQL.push(
          `ALTER TABLE ${quoteIdent(joinTable, dialect)} ADD CONSTRAINT ${quoteIdent(
            `fk_${joinTable}_${targetFk}`,
            dialect
          )} FOREIGN KEY (${quoteIdent(targetFk, dialect)}) REFERENCES ${quoteIdent(
            targetEnt.tableName,
            dialect
          )} (id) ON DELETE CASCADE;`
        );
      }
    }
  });

  if (foreignKeysSQL.length > 0) {
    output.push(`-- Foreign Key Constraints`);
    output.push(foreignKeysSQL.join('\n'));
  }

  return output.join('\n');
}

function quoteIdent(name: string, dialect: SqlDialect): string {
  if (dialect === 'mysql') return `\`${name}\``;
  return `"${name}"`;
}

function mapSqlType(type: string, dialect: SqlDialect): string {
  const lower = type.toLowerCase();
  if (lower.includes('uuid')) return dialect === 'postgresql' ? 'UUID' : 'VARCHAR(36)';
  if (lower.includes('varchar') || lower.includes('string')) return 'VARCHAR(255)';
  if (lower.includes('text')) return 'TEXT';
  if (lower.includes('int') || lower.includes('number')) return 'INTEGER';
  if (lower.includes('decimal') || lower.includes('float')) return 'NUMERIC(10,2)';
  if (lower.includes('bool')) return dialect === 'postgresql' ? 'BOOLEAN' : 'TINYINT(1)';
  if (lower.includes('timestamp') || lower.includes('date')) return dialect === 'postgresql' ? 'TIMESTAMPTZ' : 'DATETIME';
  if (lower.includes('json')) return dialect === 'postgresql' ? 'JSONB' : 'JSON';
  return 'VARCHAR(255)';
}

function formatSqlDefault(val: string): string {
  if (val === 'true' || val === 'false' || !isNaN(Number(val))) {
    return val;
  }
  return `'${val}'`;
}
