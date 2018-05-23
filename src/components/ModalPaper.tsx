import * as React from 'react';
import Paper from '@material-ui/core/Paper';
import ModalBackground from './ModalBackground';
import { withStyles, WithStyles } from '@material-ui/core/styles';

type ModalPaperClassKey =
  | 'content'
  | 'paper';

const stylesDecorator = withStyles<ModalPaperClassKey>(
  {
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
          <ModalBackground />
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
