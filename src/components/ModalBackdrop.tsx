import { BackdropProps } from '@material-ui/core/es/Backdrop';
import Fade from '@material-ui/core/es/Fade';
import {
  createStyles,
  withStyles,
  WithStyles
} from '@material-ui/core/es/styles';
import classNames from 'classnames';
import React from 'react';

const styles = createStyles({
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
    WebkitTapHighlightColor: 'transparent'
  },
  invisible: {
    backgroundColor: 'transparent',
    backgroundImage: 'none'
  }
});

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
