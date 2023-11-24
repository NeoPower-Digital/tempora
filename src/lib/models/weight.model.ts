import { BN } from '@polkadot/util';

class Weight {
  refTime: BN;
  proofSize: BN;

  constructor(refTime: BN, proofSize: BN) {
    this.refTime = refTime;
    this.proofSize = proofSize;
  }

  public muln(n: number): Weight {
    return new Weight(this.refTime.muln(n), this.proofSize.muln(n));
  }

  public add(weight: Weight): Weight {
    return new Weight(
      this.refTime.add(weight.refTime),
      this.proofSize.add(weight.proofSize)
    );
  }

  //! TODO: Delete
  public toHuman(): string {
    return `\nrefTime: ${this.refTime.toString()} - proofSize: ${this.proofSize.toString()}\n`;
  }
}

export default Weight;
