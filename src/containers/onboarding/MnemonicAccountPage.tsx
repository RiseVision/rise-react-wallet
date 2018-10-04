import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { LiskWallet } from 'dpos-offline';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
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
import { normalizeMnemonic } from '../../utils/utils';

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
  address: string | null;
  mnemonic: string;
  mnemonicInvalid: boolean;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingExistingAccountPage'
});

const messages = defineMessages({
  invalidMnemonicGeneric: {
    id: 'onboarding-existing-account.invalid-mnemonic-generic',
    description: 'Error label for invalid mnemonic text input',
    defaultMessage: 'Invalid mnemonic. A valid mnemonic is a list of 12 words.'
  }
});

@inject('onboardingStore')
@inject('routerStore')
@observer
class MnemonicAccountPage extends React.Component<DecoratedProps, State> {
  get injected(): PropsInjected & DecoratedProps {
    // @ts-ignore
    return this.props;
  }

  constructor(props: DecoratedProps) {
    super(props);

    this.state = {
      mnemonic: '',
      mnemonicInvalid: false,
      address: null
    };
  }

  handleFormSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { routerStore, onboardingStore } = this.injected;
    const { address } = this.state;
    if (!address) {
      this.setState({ mnemonicInvalid: true });
      return;
    }

    onboardingStore.address = address;
    routerStore.goTo(onboardingExistingAccountTypeRoute);
  }

  handleMnemonicChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const mnemonic = ev.target.value;

    this.setState({
      address: null,
      mnemonic,
      mnemonicInvalid: false
    });
  }

  handleMnemonicBlur = () => {
    const { mnemonic } = this.state;
    const normalized = normalizeMnemonic(mnemonic);
    if (normalized) {
      const wallet = new LiskWallet(normalized, 'R');
      this.setState({
        mnemonicInvalid: false,
        address: wallet.address
      });
      return;
    }
    this.setState({ mnemonicInvalid: true });
  }

  mnemonicError(): string | null {
    const { intl } = this.injected;
    const { address } = this.state;

    if (address) {
      return null;
    }

    return intl.formatMessage(messages.invalidMnemonicGeneric);
  }

  render() {
    const { classes } = this.injected;
    const { mnemonic, mnemonicInvalid, address } = this.state;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backLink={{ route: onboardingAddAccountRoute }}>
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
                id="onboarding-existing-account.enter-mnemonic-text"
                description="Text asking the user to fill the input field"
                defaultMessage="Enter the mnemonic of an existing RISE account you wish to access:"
              />
            </Typography>
          </Grid>
          <Grid item={true} xs={12}>
            <div className={classes.accountContainer}>
              <TextField
                className={classes.accountField}
                label={
                  <FormattedMessage
                    id="onboarding-existing-account.mnemonic-input-label"
                    description="Account mnemonic input label"
                    defaultMessage="Account mnemonic"
                  />
                }
                error={mnemonicInvalid}
                value={mnemonic}
                FormHelperTextProps={{
                  error: mnemonicInvalid
                }}
                helperText={mnemonicInvalid ? this.mnemonicError() || '' : ''}
                onChange={this.handleMnemonicChange}
                onBlur={this.handleMnemonicBlur}
              />
              <AccountIcon
                className={classes.accountIcon}
                size={48}
                address={address || ''}
              />
            </div>
          </Grid>
          {address && (
            <Grid item={true} xs={12}>
              <Typography>
                <FormattedMessage
                  id="onboarding-mnemonic-account.account-address-text"
                  description="Account address for the inputted mnemonic"
                  defaultMessage="Your account address is {address}."
                  values={{ address }}
                />
              </Typography>
            </Grid>
          )}
          <Grid item={true} xs={12}>
            <Button type="submit" fullWidth={true}>
              <FormattedMessage
                id="onboarding-existing-account.continue"
                description="Continue button label"
                defaultMessage="Continue"
              />
            </Button>
          </Grid>
        </Grid>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(injectIntl(MnemonicAccountPage));
