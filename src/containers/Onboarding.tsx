import { ReactNode } from 'react';
import * as React from 'react';
import ModalBackdrop from '../components/ModalBackdrop';

interface Props {}

const onboarding: React.SFC<Props> = function(
  props: Props & { children?: ReactNode }
) {
  return (
    <React.Fragment>
      <ModalBackdrop open={true} transitionDuration={0} />
      {props.children}
    </React.Fragment>
  );
};

export default onboarding;
