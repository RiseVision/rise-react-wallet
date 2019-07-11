import Button from '@material-ui/core/es/Button';
import Grid from '@material-ui/core/es/Grid';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/es/styles';
import TextField from '@material-ui/core/es/TextField';
import Typography from '@material-ui/core/es/Typography';
import React, { ChangeEvent, FormEvent } from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import autoId from '../../utils/autoId';
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
  name: 'AccountNameDialogContent'
});

const messages = defineMessages({
  dialogTitle: {
    id: 'account-name-dialog-content.dialog-title',
    description: 'Account name dialog title',
    defaultMessage: 'Update Account Name'
  },
  instructions: {
    id: 'account-name-dialog-content.instructions',
    description: 'Instructions before the account name input field',
    defaultMessage:
      'Assign a new name to account {address}. ' +
      'This name will only be visible to you and nobody else.'
  },
  nameField: {
    id: 'account-name-dialog-content.name-input-label',
    description: 'Account name text field label',
    defaultMessage: 'Account name'
  },
  updateButton: {
    id: 'account-name-dialog-content.update-button-label',
    description: 'Update account name button label',
    defaultMessage: 'Update name'
  }
});

type BaseProps = WithStyles<typeof styles> & DialogContentProps;

interface Props extends BaseProps, ICloseInterruptFormProps {
  account: {
    name: string;
    address: string;
  };
  onSubmit(account: { address: string; name: string }): void;
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  name: string;
}

class AccountNameDialogContent extends React.Component<DecoratedProps, State> {
  @autoId dialogContentId: string;

  state = {
    name: ''
  };

  constructor(props: DecoratedProps) {
    super(props);

    const { account } = this.props;
    this.state.name = account.name;
  }

  handleNameChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const name = ev.target.value;
    this.props.onFormChanged(this.state.name !== this.props.account.name);
    this.setState({ name });
  }

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { onSubmit, account } = this.props;
    const { name } = this.state;
    onSubmit({
      address: account.address,
      name: name.trim()
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

    const { name } = this.state;
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
            label={intl.formatMessage(messages.nameField)}
            autoFocus={true}
            value={name}
            onChange={this.handleNameChange}
            fullWidth={true}
          />
        </Grid>
        <Grid item={true} xs={12}>
          <Button
            type="submit"
            fullWidth={true}
            children={intl.formatMessage(messages.updateButton)}
          />
        </Grid>
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(AccountNameDialogContent));
