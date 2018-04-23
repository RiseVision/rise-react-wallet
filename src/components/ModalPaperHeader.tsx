import * as React from 'react';
import Typography from 'material-ui/Typography';
import { withStyles, WithStyles } from 'material-ui/styles';

type ModalPaperHeaderClassKey = 
  | 'root';

const stylesDecorator = withStyles<ModalPaperHeaderClassKey>(
  {
    root: {
      borderTopLeftRadius: 2, // Needs to match that of <Paper />
      borderTopRightRadius: 2, // Needs to match that of <Paper />
      paddingTop: 10,
      paddingBottom: 10,
      backgroundColor: '#f6f6f6',
    },
  },
  { name: 'ModalPaperHeader' }
);

interface Props {
}

const ModalPaperHeader = stylesDecorator(
  class extends React.Component<Props & WithStyles<ModalPaperHeaderClassKey>> {
    render() {
      const { classes, children } = this.props;
      return (
        <Typography className={classes.root} variant="headline" align="center">
          {children}
        </Typography>
      );
    }
  }
);

export default ModalPaperHeader;
