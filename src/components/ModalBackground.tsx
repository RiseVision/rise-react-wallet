import * as React from 'react';
import { withStyles, WithStyles } from '@material-ui/core/styles';

type ModalBackgroundClassKey =
  | 'root';

const stylesDecorator = withStyles<ModalBackgroundClassKey>(
  {
    root: {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      height: '100vh',

      backgroundColor: '#3fbb90',
      background: `linear-gradient(45deg, #3fbb90 0%, #ade690 100%)`,
      backgroundAttachment: 'fixed',
    },
  },
  { name: 'ModalBackground' }
);

interface Props {
}

type DecoratedProps = Props & WithStyles<ModalBackgroundClassKey>;

const ModalBackground = stylesDecorator<Props>(
  class extends React.Component<DecoratedProps> {
    render() {
      const { classes } = this.props;
      return (
        <div className={classes.root} />
      );
    }
  }
);

export default ModalBackground;
