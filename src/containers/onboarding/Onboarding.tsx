import React, { ReactNode } from 'react';
import ModalBackdrop from '../../components/ModalBackdrop';

interface Props {}

const onboarding: React.SFC<Props> = function(
  props: Props & { children?: ReactNode }
) {
  return (
    <>
      <ModalBackdrop open={true} transitionDuration={0} />
      {props.children}
    </>
  );
};

export default onboarding;
