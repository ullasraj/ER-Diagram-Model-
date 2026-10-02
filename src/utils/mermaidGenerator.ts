import type { ParsedEntity, EntityRelationshipEdge } from './typeormParser';

export function generateMermaidDiagram(
  entities: ParsedEntity[],
  edges: EntityRelationshipEdge[]
): string {
  if (entities.length === 0) {
    return 'erDiagram\n    %% Upload or select TypeORM entities to view ER diagram';
  }

  const lines: string[] = ['erDiagram'];

  // Add relationship connections
  edges.forEach((edge) => {
    const sourceTable = getTableName(entities, edge.sourceEntity);
    const targetTable = getTableName(entities, edge.targetEntity);

    let mermaidSymbol = '||--o{'; // default 1:N
    if (edge.relationType === 'OneToOne') {
      mermaidSymbol = '||--||';
    } else if (edge.relationType === 'ManyToOne') {
      mermaidSymbol = '}o--||';
    } else if (edge.relationType === 'ManyToMany') {
      mermaidSymbol = '}o--o{';
    } else if (edge.relationType === 'OneToMany') {
      mermaidSymbol = '||--o{';
    }

    const relLabel = edge.sourceProperty
      ? `"${edge.sourceProperty}"`
      : `"${edge.cardinalityLabel}"`;

    lines.push(`    ${sourceTable} ${mermaidSymbol} ${targetTable} : ${relLabel}`);
  });

  // Add entity definitions with columns
  entities.forEach((entity) => {
    lines.push(`    ${entity.tableName} {`);
    entity.columns.forEach((col) => {
      let keys = '';
      if (col.isPrimary) {
        keys = ' PK';
      } else if (col.isForeignKey) {
        keys = ' FK';
      } else if (col.isUnique) {
        keys = ' UK';
      }

      const typeStr = cleanTypeForMermaid(col.type);
      lines.push(`        ${typeStr} ${col.dbName}${keys}`);
    });
    lines.push('    }');
  });

  return lines.join('\n');
}

function getTableName(entities: ParsedEntity[], className: string): string {
  const found = entities.find((e) => e.className === className);
  return found ? found.tableName : className.toLowerCase();
}

function cleanTypeForMermaid(type: string): string {
  return type.replace(/[^A-Za-z0-9_]/g, '') || 'string';
}
