import * as React from 'react';
import Fade from '@material-ui/core/Fade';
import { BackdropProps } from '@material-ui/core/Backdrop';
import * as classNames from 'classnames';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';

const styles = createStyles(
  // @ts-ignore
  {
    root: {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      height: '100vh',

      backgroundColor: 'black',
      opacity: '0.7 !important',

      // Remove grey highlight
      WebkitTapHighlightColor: 'transparent'
    },
    invisible: {
      backgroundColor: 'transparent',
      backgroundImage: 'none'
    }
  }
);

type BaseProps = BackdropProps & WithStyles<typeof styles>;

interface Props extends BaseProps {}

const stylesDecorator = withStyles(styles, { name: 'ModalBackdrop' });

const ModalBackdrop = stylesDecorator(
  class extends React.Component<Props> {
    render() {
      const {
        classes,
        className,
        invisible,
        open,
        transitionDuration,
        ...other
      } = this.props;
      return (
        <Fade appear={true} in={open} timeout={transitionDuration} {...other}>
          <div
            className={classNames(
              classes.root,
              {
                // @ts-ignore
                [classes.invisible]: invisible
              },
              className
            )}
            aria-hidden="true"
          />
        </Fade>
      );
    }
  }
);

export default ModalBackdrop;
