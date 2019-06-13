import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import autoId from '../../utils/autoId';
import AccountTip from '../AccountTip';
import {
  DialogContentProps,
  SetDialogContent,
  ICloseInterruptFormProps
} from '../Dialog';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2,
      textAlign: 'center'
    }
  });

const stylesDecorator = withStyles(styles, {
  name: 'VerifyMnemonicDialogContent'
});

const messages = defineMessages({
  dialogTitle: {
    id: 'verify-mnemonic-dialog-content.dialog-title',
    description: 'Verify Mnemonic dialog title',
    defaultMessage: 'Verify Mnemonic'
  },
  instructions: {
    id: 'verify-mnemonic-dialog-content.instructions',
    description: 'Instructions before the verify mnemonic input field',
    defaultMessage: 'You can verify that your mnemonic matches this account.'
  },
  mnemonicField: {
    id: 'verify-mnemonic-dialog-content.mnemonic-input-label',
    description: 'Mnemonic text field label',
    defaultMessage: 'Secret mnemonic'
  },
  mnemonicIncorrect: {
    id: 'verify-mnemonic-dialog-content.mnemonic-input-error',
    description: 'Mnemonic text field error message',
    defaultMessage: 'Your secret mnemonic did\'t match with this account'
  },
  verifyButton: {
    id: 'verify-mnemonic-dialog-content.verify-button-label',
    description: 'Verify mnemonic button label',
    defaultMessage: 'Verify Mnemonic'
  },
  closeButton: {
    id: 'verify-mnemonic-dialog-content.close-button-label',
    description:
      'Close dialog button label once the mnemonic has been verified',
    defaultMessage: 'Close dialog'
  },
  verified: {
    id: 'verify-mnemonic-dialog-content.verified-msg',
    description: 'Message visible after the mnemonic has been verified',
    defaultMessage:
      'Provided secret mnemonic matches the one assigned with this account, all OK.'
  }
});

type BaseProps = WithStyles<typeof styles> & DialogContentProps;

interface Props extends BaseProps, ICloseInterruptFormProps {
  account: {
    address: string;
  };
  closeDialog(): void;
  onSubmit(account: { address: string; mnemonic: string }): boolean;
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  mnemonic: string;
  error: boolean;
  verified: boolean;
}

class VerifyMnemonicDialogContent extends React.Component<
  DecoratedProps,
  State
> {
  @autoId dialogContentId: string;

  state = {
    mnemonic: '',
    error: false,
    verified: false
  };

  handleNameChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const mnemonic = ev.target.value;
    this.props.onFormChanged(Boolean(this.state.mnemonic));
    this.setState({ mnemonic });
  }

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { onSubmit, account, closeDialog } = this.props;
    const { mnemonic, verified } = this.state;

    if (verified) {
      closeDialog();
      return;
    }

    const match = onSubmit({
      address: account.address,
      mnemonic: mnemonic.trim()
    });
    this.setState({
      error: !match,
      verified: match
    });
  }

  componentWillMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
      contentId: this.dialogContentId
    });
  }

  render() {
    const { intl, classes, account } = this.props;

    const { mnemonic, error, verified } = this.state;

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleFormSubmit}
      >
        {/* NOT VERIFIED */ !verified && (
          <React.Fragment>
            <Grid item={true} xs={12}>
              <Typography
                id={this.dialogContentId}
                children={intl.formatMessage(messages.instructions, {
                  address: account.address
                })}
              />
            </Grid>
            <Grid item={true} xs={12}>
              <TextField
                label={intl.formatMessage(messages.mnemonicField)}
                autoFocus={true}
                error={error}
                helperText={
                  error && intl.formatMessage(messages.mnemonicIncorrect)
                }
                value={mnemonic}
                onChange={this.handleNameChange}
                fullWidth={true}
              />
            </Grid>
            <Grid item={true} xs={12}>
              <Button
                type="submit"
                fullWidth={true}
                children={intl.formatMessage(messages.verifyButton)}
              />
            </Grid>
          </React.Fragment>
        )}
        {/*VERIFIED*/ verified && (
          <React.Fragment>
            <AccountTip
              open={true}
              message={intl.formatMessage(messages.verified)}
            />
            <Grid item={true} xs={12}>
              <Button
                type="submit"
                fullWidth={true}
                children={intl.formatMessage(messages.closeButton)}
              />
            </Grid>
          </React.Fragment>
        )}
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(VerifyMnemonicDialogContent));
