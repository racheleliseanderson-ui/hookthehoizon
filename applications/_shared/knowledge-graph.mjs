import { rejectSensitiveLocation, sanitizePublicPayload } from './privacy.mjs';

const NODE_KINDS = new Set(['condition', 'species', 'forage', 'insect', 'pattern', 'presentation', 'equipment', 'device', 'source', 'outcome']);
const RELATIONS = new Set(['supports', 'conflicts_with', 'resembles', 'uses', 'requires', 'fits', 'observed_with', 'tested_as', 'derived_from']);

function normalizeNode(node) {
  if (!node?.nodeId || !NODE_KINDS.has(node.kind) || !node.label) return null;
  return {
    nodeId: String(node.nodeId),
    kind: node.kind,
    label: String(node.label),
    attributes: node.attributes && typeof node.attributes === 'object' ? node.attributes : {},
    privacy: node.privacy || { classification: 'public_safe', retention: 'none', shareAllowed: true, analyticsAllowed: true }
  };
}

function normalizeEdge(edge) {
  if (!edge?.edgeId || !edge?.from || !edge?.to || !RELATIONS.has(edge.relation)) return null;
  return {
    edgeId: String(edge.edgeId),
    from: String(edge.from),
    to: String(edge.to),
    relation: edge.relation,
    evidenceState: edge.evidenceState || 'unknown',
    sourceIds: Array.isArray(edge.sourceIds) ? [...edge.sourceIds] : []
  };
}

export function buildKnowledgeGraph({ nodes = [], edges = [] }) {
  const privacyCheck = rejectSensitiveLocation({ nodes, edges });
  if (!privacyCheck.ok) return { status: 'invalid', errors: ['location-sensitive graph input is prohibited'], privacyFindings: privacyCheck.findings };

  const nodeMap = new Map();
  const rejectedNodes = [];
  for (const candidate of nodes) {
    const node = normalizeNode(candidate);
    if (!node || nodeMap.has(node.nodeId)) {
      rejectedNodes.push({ nodeId: candidate?.nodeId || null, reason: node ? 'duplicate_node' : 'invalid_node' });
      continue;
    }
    nodeMap.set(node.nodeId, node);
  }

  const normalizedEdges = [];
  const rejectedEdges = [];
  for (const candidate of edges) {
    const edge = normalizeEdge(candidate);
    if (!edge) {
      rejectedEdges.push({ edgeId: candidate?.edgeId || null, reason: 'invalid_edge' });
      continue;
    }
    if (!nodeMap.has(edge.from) || !nodeMap.has(edge.to)) {
      rejectedEdges.push({ edgeId: edge.edgeId, reason: 'missing_node' });
      continue;
    }
    normalizedEdges.push(edge);
  }

  const adjacency = new Map();
  for (const edge of normalizedEdges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    adjacency.get(edge.from).push(edge);
  }

  return {
    status: 'ready',
    graphVersion: '1.0.0',
    nodes: [...nodeMap.values()],
    edges: normalizedEdges,
    rejectedNodes,
    rejectedEdges,
    adjacency
  };
}

export function traverseKnowledgeGraph(graph, startNodeId, { relations = [], maxDepth = 2 } = {}) {
  if (graph?.status !== 'ready') return { status: 'invalid_graph', paths: [] };
  const relationFilter = new Set(relations);
  const nodeMap = new Map(graph.nodes.map((node) => [node.nodeId, node]));
  const queue = [{ nodeId: startNodeId, depth: 0, path: [startNodeId] }];
  const visited = new Set([startNodeId]);
  const paths = [];

  while (queue.length) {
    const current = queue.shift();
    if (current.depth >= maxDepth) continue;
    const outgoing = graph.adjacency.get(current.nodeId) || [];
    for (const edge of outgoing) {
      if (relationFilter.size && !relationFilter.has(edge.relation)) continue;
      const nextPath = [...current.path, edge.to];
      paths.push({ edge, nodes: nextPath.map((id) => nodeMap.get(id)).filter(Boolean) });
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push({ nodeId: edge.to, depth: current.depth + 1, path: nextPath });
      }
    }
  }

  const publicPayload = sanitizePublicPayload({ status: 'traversed', startNodeId, paths });
  return { ...publicPayload.sanitized, privacyFindings: publicPayload.findings };
}

export function graphFromPresentationCandidates(candidates = []) {
  const nodes = [];
  const edges = [];
  const seenNodes = new Set();

  function addNode(node) {
    if (seenNodes.has(node.nodeId)) return;
    seenNodes.add(node.nodeId);
    nodes.push(node);
  }

  for (const candidate of candidates) {
    const presentationId = `presentation:${candidate.id}`;
    addNode({
      nodeId: presentationId,
      kind: 'presentation',
      label: candidate.label,
      attributes: { actionFamily: candidate.actionFamily, depth: candidate.targetDepth, cadence: candidate.cadence },
      privacy: { classification: 'public_safe', retention: 'none', shareAllowed: true, analyticsAllowed: true }
    });

    for (const condition of candidate.conditionMatches || []) {
      const conditionId = `condition:${condition}`;
      addNode({
        nodeId: conditionId,
        kind: 'condition',
        label: String(condition).replaceAll('_', ' '),
        attributes: {},
        privacy: { classification: 'public_safe', retention: 'none', shareAllowed: true, analyticsAllowed: true }
      });
      edges.push({
        edgeId: `${presentationId}:fits:${conditionId}`,
        from: presentationId,
        to: conditionId,
        relation: 'fits',
        evidenceState: candidate.evidenceState || 'unknown',
        sourceIds: candidate.sourceIds || []
      });
    }

    for (const species of candidate.supportedSpecies || []) {
      const speciesId = `species:${species}`;
      addNode({
        nodeId: speciesId,
        kind: 'species',
        label: String(species).replaceAll('_', ' '),
        attributes: {},
        privacy: { classification: 'public_safe', retention: 'none', shareAllowed: true, analyticsAllowed: true }
      });
      edges.push({
        edgeId: `${presentationId}:supports:${speciesId}`,
        from: presentationId,
        to: speciesId,
        relation: 'supports',
        evidenceState: candidate.evidenceState || 'unknown',
        sourceIds: candidate.sourceIds || []
      });
    }
  }

  return buildKnowledgeGraph({ nodes, edges });
}
