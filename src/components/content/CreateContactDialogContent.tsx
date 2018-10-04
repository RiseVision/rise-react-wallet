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
import AccountIcon from '../AccountIcon';
import { DialogContentProps, SetDialogContent } from '../Dialog';
import autoId from '../../utils/autoId';
import { normalizeAddress } from '../../utils/utils';

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
  name: 'CreateContactDialogContent'
});

const messages = defineMessages({
  dialogTitle: {
    id: 'create-contact-dialog-content.dialog-title',
    description: 'Create contact dialog title',
    defaultMessage: 'New contact'
  },
  dialogTitleModify: {
    id: 'create-contact-dialog-content.dialog-title-modify',
    description: 'Modify contact dialog title',
    defaultMessage: 'Modify contact'
  },
  instructions: {
    id: 'create-contact-dialog-content.instructions',
    description: 'Instructions before the create contact fields',
    defaultMessage:
      'Add a new contact to your address book. ' +
      'This info will only be visible to you and nobody else.'
  },
  instructionsModify: {
    id: 'create-contact-dialog-content.instructions-modify',
    description: 'Instructions before the modify contact fields',
    defaultMessage:
      'Contact name for {id}. This info will only be visible ' +
      'to you and nobody else.'
  },
  nameField: {
    id: 'create-contact-dialog-content.name-input-label',
    description: 'Contact name text field label',
    defaultMessage: 'Contact name'
  },
  invalidName: {
    id: 'create-contact-dialog-content.invalid-name',
    description: 'Error label for invalid name text input',
    defaultMessage: 'Contact name cannot be empty.'
  },
  addressField: {
    id: 'create-contact-dialog-content.address-input-label',
    description: 'Contact address text field label',
    defaultMessage: 'Address'
  },
  invalidAddress: {
    id: 'create-contact-dialog-content.invalid-address',
    description: 'Error label for invalid address text input',
    defaultMessage:
      'Invalid RISE address. A valid address is in the format of "1234567890R".'
  },
  invalidAddressExists: {
    id: 'create-contact-dialog-content.invalid-address-exists',
    description: 'Error label for invalid address text input',
    defaultMessage: 'A contact with that address already exists.'
  },
  createButton: {
    id: 'create-contact-dialog-content.create-button-label',
    description: 'Create contact button label',
    defaultMessage: 'Create'
  },
  modifyButton: {
    id: 'create-contact-dialog-content.modify-button-label',
    description: 'Modify contact button label',
    defaultMessage: 'Modify'
  }
});

type BaseProps = WithStyles<typeof styles> & DialogContentProps;

interface Props extends BaseProps {
  checkAddressExists?: (address: string) => boolean;
  onSubmit: (data: TSubmitData) => void;
  id?: string;
  name?: string;
}

export type TSubmitData = { id: string; name: string };

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  name: string;
  nameNormalized: string;
  nameInvalid: boolean;
  address: string;
  addressNormalized: string;
  addressInvalid: boolean;
}

class CreateContactDialogContent extends React.Component<
  DecoratedProps,
  State
> {
  @autoId dialogContentId: string;

  state = {
    name: '',
    nameNormalized: '',
    nameInvalid: false,
    address: '',
    addressNormalized: '',
    addressInvalid: false
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
  }

  handleNameBlur = () => {
    const { name } = this.state;
    const nameInvalid = !!name && !!this.nameError();
    this.setState({ nameInvalid });
  }

  handleAddressChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const address = ev.target.value;
    this.setState({
      address,
      addressNormalized: normalizeAddress(address.trim()),
      addressInvalid: false
    });
  }

  handleAddressBlur = () => {
    const { address } = this.state;
    const addressInvalid = !!address && !!this.addressError();
    this.setState({ addressInvalid });
  }

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { id } = this.props;

    const nameInvalid = !!this.nameError();
    const addressInvalid = !id && Boolean(this.addressError());

    if (nameInvalid || addressInvalid) {
      this.setState({
        nameInvalid,
        addressInvalid
      });
      return;
    }

    const { onSubmit } = this.props;
    const { nameNormalized, addressNormalized } = this.state;
    onSubmit({
      id: id || addressNormalized,
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

  addressError(): string | null {
    const { intl, checkAddressExists } = this.props;
    const { addressNormalized } = this.state;

    if (addressNormalized === '') {
      return intl.formatMessage(messages.invalidAddress);
    } else if (checkAddressExists && checkAddressExists(addressNormalized)) {
      return intl.formatMessage(messages.invalidAddressExists);
    } else {
      return null;
    }
  }

  componentWillMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(
        this.props.id ? messages.dialogTitleModify : messages.dialogTitle
      ),
      contentId: this.dialogContentId
    });
  }

  render() {
    const { intl, classes, id } = this.props;

    const {
      name,
      nameInvalid,
      address,
      addressNormalized,
      addressInvalid
    } = this.state;

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
            children={intl.formatMessage(
              id ? messages.instructionsModify : messages.instructions,
              id ? { id } : undefined
            )}
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
        {!id && (
          <Grid item={true} xs={12}>
            <div className={classes.accountContainer}>
              <TextField
                className={classes.addressField}
                label={intl.formatMessage(messages.addressField)}
                value={address}
                onChange={this.handleAddressChange}
                onBlur={this.handleAddressBlur}
                error={addressInvalid}
                FormHelperTextProps={{
                  error: addressInvalid
                }}
                helperText={addressInvalid ? this.addressError() || '' : ''}
                fullWidth={true}
              />
              <AccountIcon
                className={classes.accountIcon}
                size={48}
                address={addressNormalized}
              />
            </div>
          </Grid>
        )}
        <Grid item={true} xs={12}>
          <Button
            type="submit"
            fullWidth={true}
            children={
              id
                ? intl.formatMessage(messages.modifyButton)
                : intl.formatMessage(messages.createButton)
            }
          />
        </Grid>
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(CreateContactDialogContent));