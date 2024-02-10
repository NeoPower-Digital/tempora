import { BN } from '@polkadot/util';
import { Weight as WeightV0, WeightV2 } from 'useink/core';

/**
 * Represents a weight value used in Substrate runtime logic.
 */
class Weight {
  /**
   * The reference time for the weight.
   */
  refTime: BN;

  /**
   * The proof size for the weight.
   */
  proofSize: BN;

  /**
   * Constructs a new Weight object.
   *
   * @param refTime - The reference time for the weight.
   * @param proofSize - The proof size for the weight.
   */
  constructor(refTime: BN, proofSize: BN) {
    this.refTime = refTime;
    this.proofSize = proofSize;
  }

  /**
   * Creates a new Weight object from a Substrate weight object.
   *
   * @param weight - The Substrate weight object to convert.
   * @returns A new Weight object created from the Substrate weight.
   */
  public static fromSubstrateWeight(weight: WeightV2 | WeightV0): Weight {
    const refTime = weight.refTime.unwrap().toString();
    const proofSize = weight.proofSize.unwrap().toString();

    return new Weight(new BN(refTime), new BN(proofSize));
  }

  /**
   * Multiplies the weight by a scalar value.
   *
   * @param n - The scalar value to multiply by.
   * @returns A new Weight object resulting from the multiplication.
   */
  public muln(n: number): Weight {
    return new Weight(this.refTime.muln(n), this.proofSize.muln(n));
  }

  /**
   * Adds another weight to this weight.
   *
   * @param weight - The weight to add.
   * @returns A new Weight object resulting from the addition.
   */
  public add(weight: Weight): Weight {
    return new Weight(
      this.refTime.add(weight.refTime),
      this.proofSize.add(weight.proofSize)
    );
  }
}

export default Weight;
