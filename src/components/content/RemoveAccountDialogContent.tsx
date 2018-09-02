import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import {
  FormattedMessage,
  defineMessages,
  injectIntl,
  InjectedIntlProps
} from 'react-intl';
import { DialogContentProps, SetDialogContent } from '../Dialog';
import autoId from '../../utils/autoId';

const styles = (theme: Theme) => createStyles({
  content: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center'
  }
});

const stylesDecorator = withStyles(styles, { name: 'RemoveAccountDialogContent' });

type BaseProps = WithStyles<typeof styles>
  & DialogContentProps;

interface Props extends BaseProps {
  onSubmit: () => void;
  address: string;
  name: string | null;
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  addressInput: string;
  addressInvalid: boolean;
}

const messages = defineMessages({
  dialogTitle: {
    id: 'remove-account-dialog-content.dialog-title',
    description: 'Remove account dialog title',
    defaultMessage: 'Remove account?',
  },
  invalidAddress: {
    id: 'remove-account-dialog-content.invalid-address',
    description: 'Error label for invalid account address',
    defaultMessage: 'Account address doesn\'t match the one you want to remove'
  }
});

class RemoveAccountDialogContent extends React.Component<DecoratedProps, State> {
  @autoId dialogContentId: string;

  state: State = {
    addressInput: '',
    addressInvalid: false,
  };

  handleAddressChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const addressInput = ev.target.value;
    this.setState({
      addressInput,
      addressInvalid: false,
    });
  }

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
    const { onSubmit } = this.props;
    ev.preventDefault();

    const addressInvalid = !!this.addressError();
    if (addressInvalid) {
      this.setState({
        addressInvalid
      });
      return;
    }

    onSubmit();
  }

  addressError(): null | string {
    const { intl, address } = this.props;
    const { addressInput } = this.state;

    if (addressInput.trim() === address) {
      return null;
    } else {
      return intl.formatMessage(messages.invalidAddress);
    }
  }

  componentWillMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
      contentId: this.dialogContentId,
    });
  }

  render() {
    const { classes, name, address } = this.props;
    const { addressInput, addressInvalid } = this.state;

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
            {name ? (
              <FormattedMessage
                id="remove-account-dialog-content.prompt-text"
                description="Prompt for named account removal form"
                defaultMessage={
                  'Are you sure you want to remove {name} ({address}) from the wallet? ' +
                  'To confirm, enter the account address in the field below.'}
                values={{ name, address }}
              />
            ) : (
              <FormattedMessage
                id="remove-account-dialog-content.prompt-text"
                description="Prompt for unnamed account removal form"
                defaultMessage={
                  'Are you sure you want to remove account {address} from the wallet? ' +
                  'To confirm, enter the account address in the field below.'}
                values={{ address }}
              />
            )}
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            autoFocus={true}
            label={
              <FormattedMessage
                id="remove-account-dialog-content.address-input-label"
                description="Label for account address text field."
                defaultMessage="Account address"
              />
            }
            value={addressInput}
            onChange={this.handleAddressChange}
            error={addressInvalid}
            helperText={addressInvalid ? this.addressError() : null}
            fullWidth={true}
          />
        </Grid>
        <Grid item={true} xs={12}>
          <Button type="submit" fullWidth={true}>
            <FormattedMessage
              id="remove-account-dialog-content.remove-button"
              description="Label for remove account button."
              defaultMessage="Remove account"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(RemoveAccountDialogContent));
