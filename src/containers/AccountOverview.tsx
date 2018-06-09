import * as React from 'react';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const styles = createStyles({
});

interface Props extends WithStyles<typeof styles> {
}

const stylesDecorator = withStyles(styles, { name: 'AccountOverview' });

const AccountOverview = stylesDecorator(
  class extends React.Component<Props> {
    render() {
      return (
        <Typography>
          Content TODO
        </Typography>
      );
    }
  }
);

export default AccountOverview;
