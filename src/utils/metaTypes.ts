import * as React from 'react';

export type PropsOf<T> = T extends
  | React.Component<infer P>
  | React.ComponentType<infer P>
  ? P
  : never;
