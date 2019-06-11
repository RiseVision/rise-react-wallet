import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import {
  DialogContentProps,
  SetDialogContent,
  ICloseInterruptFormProps
} from '../Dialog';
import autoId from '../../utils/autoId';

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
    defaultMessage: 'Mnemonic'
  },
  verifyButton: {
    id: 'verify-mnemonic-dialog-content.update-button-label',
    description: 'Verify mnemonic button label',
    defaultMessage: 'Verify Mnemonic'
  }
});

type BaseProps = WithStyles<typeof styles> & DialogContentProps;

interface Props extends BaseProps, ICloseInterruptFormProps {
  account: {
    address: string;
  };
  onSubmit(account: { address: string; mnemonic: string }): void;
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  mnemonic: string;
}

class VerifyMnemonicDialogContent extends React.Component<
  DecoratedProps,
  State
> {
  @autoId dialogContentId: string;

  state = {
    mnemonic: ''
  };

  handleNameChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const mnemonic = ev.target.value;
    this.props.onFormChanged(Boolean(this.state.mnemonic));
    this.setState({ mnemonic });
  }

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { onSubmit, account } = this.props;
    const { mnemonic } = this.state;
    onSubmit({
      address: account.address,
      mnemonic: mnemonic.trim()
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

    const { mnemonic } = this.state;
    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleFormSubmit}
      >
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
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(VerifyMnemonicDialogContent));
