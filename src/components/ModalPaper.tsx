import { BackdropProps } from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import Modal from '@material-ui/core/Modal';
import Paper from '@material-ui/core/Paper';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import { duration } from '@material-ui/core/styles/transitions';
import * as React from 'react';
import ModalBackdrop from './ModalBackdrop';

const styles = createStyles({
  modal: {
    overflow: 'auto'
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    minWidth: '100%',
    minHeight: '100%',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    outline: 'none'
  },
  paper: {
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 10,
    marginRight: 10,
    maxWidth: 500
  }
});

type BaseProps = React.HTMLAttributes<HTMLDivElement>
  & WithStyles<typeof styles>;

interface Props extends BaseProps {
  open: boolean;
  backdrop?: React.ReactType<BackdropProps>;
  onEscapeKeyDown?: React.ReactEventHandler<{}>;
}

const stylesDecorator = withStyles(styles, { name: 'ModalPaper' });

const ModalPaper = stylesDecorator(
  class extends React.Component<Props> {
    render() {
      const {
        classes,
        open,
        backdrop,
        onEscapeKeyDown,
        children,
        role,
        ...other
      } = this.props;
      const transitionDuration = {
        enter: duration.enteringScreen,
        exit: duration.leavingScreen
      };
      return (
        <Modal
          open={open}
          className={classes.modal}
          BackdropProps={{
            transitionDuration
          }}
          BackdropComponent={this.props.backdrop || ModalBackdrop}
          onEscapeKeyDown={onEscapeKeyDown}
        >
          <div
            className={classes.content}
            role={role || 'dialog'}
            aria-modal={true}
            {...other}
          >
            <Fade appear={true} in={open} timeout={transitionDuration}>
              <Paper className={classes.paper}>{children}</Paper>
            </Fade>
          </div>
        </Modal>
      );
    }
  }
);

export default ModalPaper;
