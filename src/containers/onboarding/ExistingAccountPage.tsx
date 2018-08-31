import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import AccountIcon from '../../components/AccountIcon';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import {
  onboardingAddAccountRoute,
  onboardingExistingAccountTypeRoute
} from '../../routes';
import OnboardingStore from '../../stores/onboarding';
import { normalizeAddress } from '../../utils/utils';

const styles = createStyles({
  content: {
    padding: 20
  },
  accountContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  accountField: {
    flex: 1
  },
  accountIcon: {
    marginLeft: 10
  }
});

interface Props extends WithStyles<typeof styles> {}

interface PropsInjected extends Props {
  onboardingStore: OnboardingStore;
  routerStore: RouterStore;
}

interface State {
  address: string;
  addressInvalid: boolean;
  normalizedAddress: string;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingExistingAccountPage'
});

const messages = defineMessages({
  invalidAddressGeneric: {
    id: 'onboarding-existing-account.invalid-address-generic',
    description: 'Error label for invalid address text input',
    defaultMessage:
      'Invalid RISE address. A valid address is in the format of "1234567890R".'
  },
  invalidAddressMnemonic: {
    id: 'onboarding-existing-account.invalid-address-mnemonic',
    description:
      'Error label for invalid address text input when it looks like a mnemonic',
    defaultMessage:
      'Looks like you\'re trying to enter your passphrase. Please enter your account address instead.'
  }
});

@inject('onboardingStore')
@inject('routerStore')
@observer
class ExistingAccountPage extends React.Component<DecoratedProps, State> {
  get injected(): PropsInjected & DecoratedProps {
    // @ts-ignore
    return this.props;
  }

  constructor(props: DecoratedProps) {
    super(props);

    const { onboardingStore } = this.injected;
    const address = onboardingStore.address || '';
    this.state = {
      address,
      addressInvalid: false,
      normalizedAddress: normalizeAddress(address.trim())
    };
  }

  handleBackClick = () => {
    const { routerStore } = this.injected;
    routerStore.goTo(onboardingAddAccountRoute);
  }

  handleFormSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { routerStore, onboardingStore } = this.injected;
    const { normalizedAddress } = this.state;
    const addressInvalid = !normalizedAddress;
    if (addressInvalid) {
      this.setState({ addressInvalid: true });
      return;
    }

    onboardingStore.address = normalizedAddress;
    routerStore.goTo(onboardingExistingAccountTypeRoute);
  }

  handleAddressChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const address = ev.target.value;
    const normalizedAddress = normalizeAddress(address.trim());

    this.setState({
      address,
      addressInvalid: false,
      normalizedAddress
    });
  }

  handleAddressBlur = () => {
    const { address, normalizedAddress } = this.state;
    const addressInvalid = !!address && !normalizedAddress;
    this.setState({ addressInvalid });
  }

  addressError(): string | null {
    const { intl } = this.injected;
    const { address, normalizedAddress } = this.state;
    if (normalizedAddress !== '') {
      return null;
    }

    if (address.trim().indexOf(' ') >= 0) {
      return intl.formatMessage(messages.invalidAddressMnemonic);
    } else {
      return intl.formatMessage(messages.invalidAddressGeneric);
    }
  }

  render() {
    const { classes } = this.injected;
    const { address, addressInvalid, normalizedAddress } = this.state;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backButton={true} onBackClick={this.handleBackClick}>
          <FormattedMessage
            id="onboarding-existing-account.title"
            description="Existing account screen title"
            defaultMessage="Existing account"
          />
        </ModalPaperHeader>
        <Grid
          container={true}
          className={classes.content}
          spacing={16}
          component="form"
          onSubmit={this.handleFormSubmit}
        >
          <Grid item={true} xs={12}>
            <Typography>
              <FormattedMessage
                id="onboarding-existing-account.enter-address-text"
                description="Text asking the user to fill the input field"
                defaultMessage="Enter the address of an existing RISE account you wish to access:"
              />
            </Typography>
          </Grid>
          <Grid item={true} xs={12}>
            <div className={classes.accountContainer}>
              <TextField
                className={classes.accountField}
                label={
                  <FormattedMessage
                    id="onboarding-existing-account.address-input-label"
                    description="Account address input label"
                    defaultMessage="Account address"
                  />
                }
                error={addressInvalid}
                value={address}
                FormHelperTextProps={{
                  error: addressInvalid
                }}
                helperText={addressInvalid ? this.addressError() || '' : ''}
                onChange={this.handleAddressChange}
                onBlur={this.handleAddressBlur}
              />
              <AccountIcon
                className={classes.accountIcon}
                size={48}
                address={normalizedAddress}
              />
            </div>
          </Grid>
          <Grid item={true} xs={12}>
            <Button type="submit" fullWidth={true}>
              <FormattedMessage
                id="onboarding-existing-account.continue"
                description="Continue button label"
                defaultMessage="Continue"
              />
            </Button>
          </Grid>
          <Grid item={true} xs={12}>
            <Typography>
              <FormattedMessage
                id="onboarding-existing-account.recover-from-mnemonic"
                description="Instructions for people who forgot their account address"
                defaultMessage="Forgotten your address but have your secret mnemonic? Click here"
              />
            </Typography>
          </Grid>
        </Grid>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(injectIntl(ExistingAccountPage));
