import BigNumber from 'bignumber.js';

const unitScale = new BigNumber('1e8');

export class UnitAmount {
  private n: BigNumber;

  constructor(value: string | number | BigNumber) {
    this.n = new BigNumber(value);
  }

  toBigNumber(): BigNumber {
    return this.n;
  }

  toNumber(): number {
    return this.n.toNumber();
  }

  toString(): string {
    return this.n.toString();
  }

  valueOf() {
    return this.n.valueOf();
  }
}

export class RawAmount {
  static readonly ZERO = new RawAmount(0);

  private n: BigNumber;

  static fromUnit(value: string | number | BigNumber | UnitAmount): RawAmount {
    let n: BigNumber;
    if (value instanceof UnitAmount) {
      n = value.toBigNumber();
    } else {
      n = new BigNumber(value);
    }
    return new RawAmount(n.mul(unitScale));
  }

  constructor(value: string | number | BigNumber) {
    this.n = new BigNumber(value);
  }

  get unit(): UnitAmount {
    return new UnitAmount(this.n.div(unitScale));
  }

  plus(rhs: RawAmount): RawAmount {
    return new RawAmount(this.n.plus(rhs.n));
  }

  minus(rhs: RawAmount): RawAmount {
    return new RawAmount(this.n.minus(rhs.n));
  }

  eq(rhs: RawAmount): boolean {
    return this.n.eq(rhs.n);
  }

  gt(rhs: RawAmount): boolean {
    return this.n.gt(rhs.n);
  }

  gte(rhs: RawAmount): boolean {
    return this.n.gte(rhs.n);
  }

  lte(rhs: RawAmount): boolean {
    return this.n.lte(rhs.n);
  }

  lt(rhs: RawAmount): boolean {
    return this.n.lt(rhs.n);
  }

  toBigNumber(): BigNumber {
    return this.n;
  }

  toNumber(): number {
    return this.n.toNumber();
  }

  toString(): string {
    return this.n.toString();
  }

  valueOf() {
    return this.n.valueOf();
  }
}
