import * as React from 'react';
import Paper from 'material-ui/Paper';
import { withStyles, WithStyles } from 'material-ui/styles';

type ModalPaperClassKey = 
  | 'root';

const stylesDecorator = withStyles<ModalPaperClassKey>(
  {
    root: {
      position: 'absolute',
      top: 0,
      left: 0,
      minWidth: '100%',
      minHeight: '100%',

      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: '#3fbb90',
      background: `linear-gradient(45deg, #3fbb90 0%, #ade690 100%)`,
      backgroundAttachment: 'fixed',
    },
  },
  { name: 'ModalPaper' }
);

interface Props {
}

const ModalPaper = stylesDecorator(
  class extends React.Component<Props & WithStyles<ModalPaperClassKey>> {
    render() {
      const { classes, children } = this.props;
      return (
        <div className={classes.root}>
          <Paper>
            {children}
          </Paper>
        </div>
      );
    }
  }
);

export default ModalPaper;
