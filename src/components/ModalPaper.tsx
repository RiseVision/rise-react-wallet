import * as React from 'react';
import Paper from '@material-ui/core/Paper';
import Modal from '@material-ui/core/Modal';
import ModalBackdrop from './ModalBackdrop';
import { withStyles, WithStyles } from '@material-ui/core/styles';

type ModalPaperClassKey =
  | 'modal'
  | 'content'
  | 'paper';

const stylesDecorator = withStyles<ModalPaperClassKey>(
  {
    modal: {
      overflow: 'auto',
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
    },
    paper: {
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 10,
      marginRight: 10,
      maxWidth: 500,
    },
  },
  { name: 'ModalPaper' }
);

interface Props {
}

type DecoratedProps = Props & WithStyles<ModalPaperClassKey>;

const ModalPaper = stylesDecorator<Props>(
  class extends React.Component<DecoratedProps> {
    render() {
      const { classes, children } = this.props;
      return (
        <Modal
          open={true}
          className={classes.modal}
          BackdropComponent={ModalBackdrop}
        >
          <div className={classes.content}>
            <Paper className={classes.paper}>
              {children}
            </Paper>
          </div>
        </Modal>
      );
    }
  }
);

export default ModalPaper;
