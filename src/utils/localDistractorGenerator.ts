/**
 * Generates 3 plausible MCQ wrong options (distractors) on-device
 * using rule-based educational and domain-contrastive heuristics.
 */
export function generateLocalDistractors(
  question: string,
  correctAnswer: string,
  subject = 'Computer Science'
): { distractors: string[]; explanation: string } {
  const q = question.toLowerCase();
  const a = correctAnswer.trim();

  const domainTaxonomies: Record<string, string[]> = {
    complexity: [
      'O(n^2) quadratic bounding with nested iteration overhead',
      'O(log n) logarithmic reduction requiring pre-sorted balanced indexing',
      'O(n!) factorial recursion resulting in exponential space expansion',
      'O(1) constant amortized lookup without secondary hashing',
      'O(n log n) linearithmic distribution requiring auxiliary merge buffers',
    ],
    distributed: [
      'Two-Phase Commit with non-blocking coordinator election fallback',
      'Byzantine fault tolerance requiring 3f + 1 quorum thresholds',
      'Eventual consistency with asynchronous gossip reconciliation',
      'Read-committed isolation vulnerable to non-repeatable read skew',
      'Strict linearizability requiring global NTP wall-clock synchronization',
    ],
    security: [
      'Static 2D presentation attack bypass using high-resolution printed halftone masks',
      'Adversarial FGSM perturbation along the loss gradient of the classifier',
      'Moiré frequency harmonic cancellation through optical low-pass filtration',
      'Symmetric session key exchange without forward secrecy guarantees',
      'Asymmetric RSA signing using unpadded PKCS#1 v1.5 standard',
    ],
    networks: [
      'Slow Start congestion avoidance resetting cwnd to 1 Maximum Segment Size',
      'Fast Recovery entered upon reception of 3 duplicate cumulative ACKs',
      'Selective Repeat ARQ with sliding window buffering on receiver',
      'Stop-and-Wait protocol with unpipelined round-trip delay overhead',
      'Explicit Congestion Notification (ECN) marking IP header DiffServ bits',
    ],
  };

  // Determine matching domain category
  let categoryPool: string[] = [];
  if (q.includes('complexity') || q.includes('big o') || q.includes('time') || q.includes('algorithm')) {
    categoryPool = domainTaxonomies.complexity;
  } else if (q.includes('distribut') || q.includes('consensus') || q.includes('database') || q.includes('acid') || q.includes('raft')) {
    categoryPool = domainTaxonomies.distributed;
  } else if (q.includes('spoof') || q.includes('security') || q.includes('attack') || q.includes('liveness')) {
    categoryPool = domainTaxonomies.security;
  } else if (q.includes('tcp') || q.includes('network') || q.includes('protocol') || q.includes('packet')) {
    categoryPool = domainTaxonomies.networks;
  } else {
    categoryPool = [
      ...domainTaxonomies.distributed,
      ...domainTaxonomies.complexity,
    ];
  }

  // Filter out any distractor that matches the correct answer
  const filtered = categoryPool.filter(
    (item) => item.toLowerCase() !== a.toLowerCase() && !item.toLowerCase().includes(a.toLowerCase())
  );

  // If we have enough from taxonomy, use top 3
  if (filtered.length >= 3) {
    return {
      distractors: filtered.slice(0, 3),
      explanation: 'On-device pedagogical engine generated plausible technical alternatives testing core domain misconceptions.',
    };
  }

  // Fallback heuristic synthetics
  const synthetics = [
    `Inverted variation of "${a.slice(0, 35)}" with unconstrained synchronous lock contention`,
    `Stateless approximation of "${a.slice(0, 35)}" lacking deterministic state verification`,
    `Deprecated standard protocol operating with secondary buffer overflow risks`,
  ];

  return {
    distractors: synthetics,
    explanation: 'On-device educational engine synthesized plausible contrastive alternatives.',
  };
}
