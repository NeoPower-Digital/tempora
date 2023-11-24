const Environments = {
  Development: 'dev',
  Testing: 'testing',
  Kusama: 'kusama',
} as const;

export type Environment = (typeof Environments)[keyof typeof Environments];

export default Environments;
