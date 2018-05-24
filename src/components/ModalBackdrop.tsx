import * as React from 'react';
import Fade from '@material-ui/core/Fade';
import { BackdropProps } from '@material-ui/core/Backdrop';
import * as classNames from 'classnames';
import { withStyles, WithStyles } from '@material-ui/core/styles';

type ModalBackdropClassKey =
  | 'root'
  | 'invisible';

const stylesDecorator = withStyles<ModalBackdropClassKey>(
  {
    root: {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      height: '100vh',

      backgroundColor: '#3fbb90',
      backgroundImage: `linear-gradient(45deg, #3fbb90 0%, #ade690 100%)`,
      backgroundAttachment: 'fixed',

      // Remove grey highlight
      WebkitTapHighlightColor: 'transparent',
    },
    invisible: {
      backgroundColor: 'transparent',
      backgroundImage: 'none',
    },
  },
  { name: 'ModalBackdrop' }
);

type DecoratedProps = BackdropProps & WithStyles<ModalBackdropClassKey>;

const ModalBackdrop = stylesDecorator<BackdropProps>(
  class extends React.Component<DecoratedProps> {
    render() {
      const { classes, className, invisible, open, transitionDuration, ...other } = this.props;
      return (
        <Fade appear={true} in={open} timeout={transitionDuration} {...other}>
          <div
            className={classNames(
              classes.root,
              {
                [classes.invisible]: invisible,
              },
              className,
            )}
            aria-hidden="true"
          />
        </Fade>
      );
    }
  }
);

export default ModalBackdrop;
