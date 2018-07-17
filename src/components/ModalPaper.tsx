import { BackdropProps } from '@material-ui/core/Backdrop';
import * as React from 'react';
import Paper from '@material-ui/core/Paper';
import Modal from '@material-ui/core/Modal';
import Fade from '@material-ui/core/Fade';
import ModalBackdrop from './ModalBackdrop';
import { duration } from '@material-ui/core/styles/transitions';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';

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

interface Props extends WithStyles<typeof styles> {
  open: boolean;
  backdrop?: React.ReactType<BackdropProps>;
}

const stylesDecorator = withStyles(styles, { name: 'ModalPaper' });

const ModalPaper = stylesDecorator(
  class extends React.Component<Props> {
    render() {
      const { classes, open, children } = this.props;
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
        >
          <Fade appear={true} in={open} timeout={transitionDuration}>
            <div className={classes.content}>
              <Paper className={classes.paper}>{children}</Paper>
            </div>
          </Fade>
        </Modal>
      );
    }
  }
);

export default ModalPaper;
