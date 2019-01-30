import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import * as React from 'react';
import {
  FormattedMessage,
  defineMessages,
  injectIntl,
  InjectedIntlProps
} from 'react-intl';
import { DialogContentProps, SetDialogContent } from '../Dialog';
import autoId from '../../utils/autoId';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2,
      textAlign: 'center'
    }
  });

const stylesDecorator = withStyles(styles, { name: 'SignOutDialogContent' });

type BaseProps = WithStyles<typeof styles> & DialogContentProps;

interface Props extends BaseProps {
  onConfirm: () => void;
  onCancel: () => void;
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {}

const messages = defineMessages({
  dialogTitle: {
    id: 'sign-out-dialog-content.dialog-title',
    description: 'Sign out dialog title',
    defaultMessage: 'Sign out?'
  }
});

class SignOutDialogContent extends React.Component<DecoratedProps, State> {
  @autoId dialogContentId: string;

  componentWillMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
      contentId: this.dialogContentId
    });
  }

  render() {
    const { classes, onConfirm, onCancel } = this.props;

    return (
      <Grid className={classes.content} container={true} spacing={16}>
        <Grid item={true} xs={12}>
          <Typography id={this.dialogContentId}>
            <FormattedMessage
              id="sign-out-dialog-content.prompt-text"
              description="Prompt for sign out action"
              defaultMessage={
                'Are you sure you want sign out? All of your accounts ' +
                'and address book content will be removed from this device.'
              }
            />
          </Typography>
        </Grid>
        <Grid item={true} xs={12} sm={6}>
          <Button fullWidth={true} onClick={onConfirm}>
            <FormattedMessage
              id="sign-out-dialog-content.sign-out-button"
              description="Label for remove account button."
              defaultMessage="Sign out"
            />
          </Button>
        </Grid>
        <Grid item={true} xs={12} sm={6}>
          <Button fullWidth={true} onClick={onCancel}>
            <FormattedMessage
              id="sign-out-dialog-content.cancel-button"
              description="Label for cancel button."
              defaultMessage="Cancel"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(SignOutDialogContent));
