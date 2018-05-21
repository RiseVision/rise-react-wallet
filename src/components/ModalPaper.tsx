import * as React from 'react';
import Paper from '@material-ui/core/Paper';
import { withStyles, WithStyles } from '@material-ui/core/styles';

type ModalPaperClassKey =
  | 'background'
  | 'content'
  | 'paper';

const stylesDecorator = withStyles<ModalPaperClassKey>(
  {
    background: {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      height: '100vh',

      backgroundColor: '#3fbb90',
      background: `linear-gradient(45deg, #3fbb90 0%, #ade690 100%)`,
      backgroundAttachment: 'fixed',
    },
    content: {
      position: 'absolute',
      top: 0,
      left: 0,
      minWidth: '100%',
      minHeight: '100%',

      overflow: 'auto',

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
        <React.Fragment>
          <div className={classes.background} />
          <div className={classes.content}>
            <Paper className={classes.paper}>
              {children}
            </Paper>
          </div>
        </React.Fragment>
      );
    }
  }
);

export default ModalPaper;
