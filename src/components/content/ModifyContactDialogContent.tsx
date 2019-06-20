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
import React from 'react';
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
    },
    accountContainer: {
      display: 'flex',
      alignItems: 'center',
      position: 'relative'
    },
    addressField: {
      flex: 1
    },
    accountIcon: {
      marginLeft: 10
    }
  });

const stylesDecorator = withStyles(styles, {
  name: 'ModifyContactDialogContent'
});

const messages = defineMessages({
  dialogTitle: {
    id: 'modify-contact-dialog-content.dialog-title',
    description: 'Modify contact dialog title',
    defaultMessage: 'Modify contact'
  },
  instructions: {
    id: 'modify-contact-dialog-content.instructions',
    description: 'Instructions before the modify contact fields',
    defaultMessage:
      'Contact name for {address}. This info will only be visible ' +
      'to you and nobody else.'
  },
  nameField: {
    id: 'modify-contact-dialog-content.name-input-label',
    description: 'Contact name text field label',
    defaultMessage: 'Contact name'
  },
  invalidName: {
    id: 'modify-contact-dialog-content.invalid-name',
    description: 'Error label for invalid name text input',
    defaultMessage: 'Contact name cannot be empty.'
  },
  modifyButton: {
    id: 'modify-contact-dialog-content.modify-button-label',
    description: 'Modify contact button label',
    defaultMessage: 'Modify'
  }
});

type BaseProps = WithStyles<typeof styles> & DialogContentProps;

interface Props extends BaseProps, ICloseInterruptFormProps {
  onSubmit: (data: TSubmitData) => void;
  address: string;
  name: string;
}

export type TSubmitData = { address: string; name: string };

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  name: string;
  nameNormalized: string;
  nameInvalid: boolean;
}

class ModifyContactDialogContent extends React.Component<
  DecoratedProps,
  State
> {
  @autoId dialogContentId: string;

  state = {
    name: '',
    nameNormalized: '',
    nameInvalid: false
  };

  constructor(props: DecoratedProps) {
    super(props);
    if (props.name) {
      this.state.name = props.name;
      this.state.nameNormalized = props.name;
    }
  }

  handleNameChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const name = ev.target.value;
    this.setState({
      name,
      nameNormalized: name.trim(),
      nameInvalid: false
    });
    this.props.onFormChanged(Boolean(name !== this.props.name));
  }

  handleNameBlur = () => {
    const { name } = this.state;
    const nameInvalid = !!name && !!this.nameError();
    this.setState({ nameInvalid });
  }

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { address } = this.props;

    const nameInvalid = !!this.nameError();

    if (nameInvalid) {
      this.setState({
        nameInvalid
      });
      return;
    }

    const { onSubmit } = this.props;
    const { nameNormalized } = this.state;
    onSubmit({
      address,
      name: nameNormalized
    });
  }

  nameError(): string | null {
    const { intl } = this.props;
    const { nameNormalized } = this.state;

    if (nameNormalized === '') {
      return intl.formatMessage(messages.invalidName);
    } else {
      return null;
    }
  }

  componentWillMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
      contentId: this.dialogContentId
    });
  }

  render() {
    const { intl, classes, address } = this.props;

    const { name, nameInvalid } = this.state;

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
            children={intl.formatMessage(messages.instructions, { address })}
          />
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            label={intl.formatMessage(messages.nameField)}
            autoFocus={true}
            value={name}
            onChange={this.handleNameChange}
            onBlur={this.handleNameBlur}
            error={nameInvalid}
            FormHelperTextProps={{
              error: nameInvalid
            }}
            helperText={nameInvalid ? this.nameError() || '' : ''}
            fullWidth={true}
          />
        </Grid>
        <Grid item={true} xs={12}>
          <Button
            type="submit"
            fullWidth={true}
            children={intl.formatMessage(messages.modifyButton)}
          />
        </Grid>
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(ModifyContactDialogContent));
