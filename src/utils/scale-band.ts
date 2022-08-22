export const scaleBand = () => {
  let domain: any[] = [];
  let fixedBandwidth: number | null = null;
  let bandwidth = 1;
  let range = [0, 1];
  let rangeSize = range[1] - range[0];
  let paddingInner: number[] = [];
  // If `true` the padding will begin before the first bar!
  let paddingInnerZeroBased = false;
  let totalWidth = 0;

  const sum = (a: number, b: number) => a + b;
  const getBandwidth = () => fixedBandwidth || bandwidth;

  const update = () => {
    rangeSize = range[1] - range[0];

    const totalPaddingInner = paddingInner.reduce(sum, 0);
    bandwidth = (rangeSize - totalPaddingInner) / domain.length;
    totalWidth = totalPaddingInner + domain.length * getBandwidth();
  };

  const scale = (v: any) => {
    const idx = domain.indexOf(v);

    if (idx === -1) return undefined;

    return (
      idx * getBandwidth() +
      paddingInner.slice(0, idx + Number(paddingInnerZeroBased)).reduce(sum, 0)
    );
  };

  scale.domain = (newDomain: any[]) => {
    domain = [...newDomain];
    update();
    return scale;
  };

  scale.range = (newRange: number[]) => {
    range = [...newRange];
    update();
    return scale;
  };

  scale.bandwidth = () => getBandwidth();

  scale.fixedBandwidth = (newFixedBandwidth: number) => {
    fixedBandwidth = newFixedBandwidth;
    update();
    return scale;
  };

  scale.totalWidth = () => totalWidth;

  scale.rangeSize = () => rangeSize;

  scale.paddingInner = (newPaddingInner: number[]) => {
    paddingInner = newPaddingInner;
    update();
    return scale;
  };

  scale.paddingInnerZeroBased = (newPaddingInnerZeroBased: boolean) => {
    paddingInnerZeroBased = newPaddingInnerZeroBased;
    update();
    return scale;
  };

  return scale;
};
