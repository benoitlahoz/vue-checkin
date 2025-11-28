export type TransformParam = {
  name: string;
  type: string;
  label: string;
  default: any;
};

export type Transform = {
  name: string;
  if: (v: any) => boolean;
  fn: (...args: any[]) => any;
  params: TransformParam[];
};

export type CodecNode = {
  name?: string;
  params: Record<string, any>;
  siblings: CodecNode[];
  children: CodecNode[];
};
