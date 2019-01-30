import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import * as React from 'react';
import { ChangeEvent, FormEvent, ReactEventHandler } from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import {
  DialogContentProps,
  SetDialogContent,
  ICloseInterruptFormProps
} from '../Dialog';
import autoId from '../../utils/autoId';
import { RawAmount } from '../../utils/amounts';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2,
      textAlign: 'center'
    }
  });

const stylesDecorator = withStyles(styles, {
  name: 'AddSecondPassphraseDialogContent'
});

type BaseProps = WithStyles<typeof styles> & DialogContentProps;

interface Props extends BaseProps, ICloseInterruptFormProps {
  onSubmit: (passphrase: string) => void;
  onClose: ReactEventHandler<{}>;
  passphrase?: string;
  passphraseFee: RawAmount;
  error?: null | 'already-set' | 'insufficient-funds';
}

type DecoratedProps = Props & InjectedIntlProps;

export interface State {
  passphrase: string;
  passphraseInvalid: boolean;
}

const messages = defineMessages({
  dialogTitle: {
    id: 'add-second-passphrase-dialog-content.dialog-title',
    description: 'Add second passphrase dialog title',
    defaultMessage: 'Setup 2nd passphrase'
  },
  invalidPassphrase: {
    id: 'add-second-passphrase-dialog-content.invalid-passphrase',
    description: 'Error label for invalid passphrase text input',
    defaultMessage: 'Invalid passphrase. Passphrase cannot be empty.'
  }
});

class AddSecondPassphraseDialogContent extends React.Component<
  DecoratedProps,
  State
> {
  @autoId dialogContentId: string;

  state: State = {
    passphrase: '',
    passphraseInvalid: false
  };

  constructor(props: DecoratedProps) {
    super(props);
    this.state.passphrase = props.passphrase || '';
  }

  handlePassphraseChanged = (ev: ChangeEvent<HTMLInputElement>) => {
    const passphrase = ev.target.value.trim();

    this.props.onFormChanged(Boolean(passphrase));

    this.setState({
      passphrase,
      passphraseInvalid: false
    });
  }

  handlePassphraseBlur = () => {
    const { passphrase } = this.state;
    const passphraseInvalid = !!passphrase && !!this.passphraseError();
    this.setState({ passphraseInvalid });
  }

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { onSubmit } = this.props;
    const { passphrase } = this.state;

    const passphraseInvalid = !!this.passphraseError();
    if (passphraseInvalid) {
      this.setState({
        passphraseInvalid
      });
      return;
    }

    onSubmit(passphrase);
  }

  passphraseError(): string | null {
    const { intl } = this.props;
    const { passphrase } = this.state;

    return passphrase ? null : intl.formatMessage(messages.invalidPassphrase);
  }

  componentWillMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
      contentId: this.dialogContentId
    });
  }

  render() {
    const { intl, classes, error, passphraseFee } = this.props;
    const { passphrase, passphraseInvalid } = this.state;

    const formatAmount = (amount: RawAmount) =>
      `${intl.formatNumber(amount.unit.toNumber())} RISE`;

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleFormSubmit}
      >
        <Grid item={true} xs={12}>
          <Typography id={this.dialogContentId}>
            <FormattedMessage
              id="add-second-passphrase-dialog-content.instructions-about"
              description="Instructions for setup 2nd passphrase form"
              defaultMessage={
                'The second passphrase offers an extra layer of protection for forgers ' +
                'whose primary mnemonic is stored on servers which can potentially get ' +
                'hacked and compromise the primary mnemonic.'
              }
            />
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <Typography>
            <FormattedMessage
              id="add-second-passphrase-dialog-content.instructions-immutable"
              description="Warning about the 2nd passphrase being immutable"
              defaultMessage="Once the 2nd passphrase has been set it cannot be changed nor removed."
            />
          </Typography>
        </Grid>
        {error === 'insufficient-funds' && (
          <Grid item={true} xs={12}>
            <Typography color="error">
              <FormattedMessage
                id="add-second-passphrase-dialog-content.insufficient-funds-error"
                description="Error about not having enough funds to setup a passphrase"
                defaultMessage={
                  'You don\'t have enough funds in your account to pay the network fee ' +
                  'of {fee} to setup a 2nd passphrase!'
                }
                values={{
                  fee: formatAmount(passphraseFee)
                }}
              />
            </Typography>
          </Grid>
        )}
        {error === 'already-set' && (
          <Grid item={true} xs={12}>
            <Typography color="error">
              <FormattedMessage
                id="add-second-passphrase-dialog-content.already-set-error"
                description="Error about the 2nd passphrase being set already"
                defaultMessage={
                  'You\'ve already set a 2nd passphrase for this account. You need to ' +
                  'create a new account should you wish to change your passphrase.'
                }
              />
            </Typography>
          </Grid>
        )}
        {!error && (
          <Grid item={true} xs={12}>
            <TextField
              autoFocus={true}
              type="password"
              label={
                <FormattedMessage
                  id="add-second-passphrase-dialog-content.passphrase-input-label"
                  description="Label for 2nd passphrase text field."
                  defaultMessage="2nd passphrase"
                />
              }
              value={passphrase}
              onChange={this.handlePassphraseChanged}
              onBlur={this.handlePassphraseBlur}
              fullWidth={true}
              error={passphraseInvalid}
              FormHelperTextProps={{
                error: passphraseInvalid
              }}
              helperText={passphraseInvalid ? this.passphraseError() || '' : ''}
            />
          </Grid>
        )}
        <Grid item={true} xs={12}>
          {!error ? (
            <Button type="submit" fullWidth={true}>
              <FormattedMessage
                id="add-second-passphrase-dialog-content.continue-button"
                description="Label for continue button."
                defaultMessage="Continue"
              />
            </Button>
          ) : (
            <Button onClick={this.props.onClose} fullWidth={true}>
              <FormattedMessage
                id="add-second-passphrase-dialog-content.close-button"
                description="Label for close button."
                defaultMessage="Close"
              />
            </Button>
          )}
        </Grid>
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(AddSecondPassphraseDialogContent));
