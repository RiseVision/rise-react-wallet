import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { observable, reaction, IReactionDisposer, runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import LedgerConnectIllustration from '../../components/LedgerConnectIllustration';
import AccountIcon from '../../components/AccountIcon';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import {
  onboardingAddAccountRoute,
} from '../../routes';
import { AccountType } from '../../stores/account';
import OnboardingStore from '../../stores/onboarding';
import WalletStore from '../../stores/wallet';
import LedgerStore, { LedgerAccount, LedgerChannel } from '../../stores/ledger';

const styles = createStyles({
  content: {
    padding: 20,
    textAlign: 'center',
  },
  noPadding: {
    marginLeft: -20,
    marginRight: -20,
  },
  accountAvatar: {
    backgroundColor: 'white'
  },
});

interface Props extends WithStyles<typeof styles> {}

type DecoratedProps = Props & InjectedIntlProps;

interface PropsInjected extends DecoratedProps {
  onboardingStore: OnboardingStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
  ledgerStore: LedgerStore;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingLedgerAccountPage'
});

const messages = defineMessages({
  connectInstructions: {
    id: 'onboarding-ledger-account.connect-instructions',
    description: 'Text instructing the user to open the RISE app on their Ledger device',
    defaultMessage: 'Connect your Ledger & open the RISE app on it.',
  },
  unsupportedBrowser: {
    id: 'onboarding-ledger-account.unsupported-browser',
    description: 'Message when trying to use a browser that doesn\'t support Ledger devices',
    defaultMessage:
      'Your browser doesn\'t support using a Ledger device. If you wish to access this feature, ' +
      'you could try again with Google Chrome. It is a browser known to implement support for this.',
  },
  statusConnecting: {
    id: 'onboarding-ledger-account.status-connecting',
    description: 'Status text when attempting to connect to the Ledger device',
    defaultMessage: 'Trying to connect...',
  },
  accountNrLabel: {
    id: 'onboarding-ledger-account.account-nr-label',
    description: 'Label for the account number available for import',
    defaultMessage: 'Account #{number}',
  },
});

class AccountData {
  @observable data: null | LedgerAccount;

  constructor(ledger: LedgerChannel, readonly slot: number) {
    this.load(ledger);
  }

  private async load(ledger: LedgerChannel) {
    try {
      const resp = await ledger.getAccount(this.slot);
      runInAction(() => {
        this.data = resp;
      });
    } catch (ex) {
      // Ignore failures
    }
}
}

@inject('onboardingStore')
@inject('routerStore')
@inject('walletStore')
@inject('ledgerStore')
@observer
class LedgerAccountPage extends React.Component<DecoratedProps> {
  private ledger: LedgerChannel;
  private disposeAccountLoader: null | IReactionDisposer = null;

  @observable private accounts = observable.array<AccountData>([]);

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  componentWillMount() {
    const { ledgerStore } = this.injected;
    this.ledger = ledgerStore.openChannel();

    this.disposeAccountLoader = reaction(
      () => this.ledger.deviceId,
      this.accountLoader,
    );
    this.accountLoader();
  }

  componentWillUnmount() {
    if (this.disposeAccountLoader) {
      this.disposeAccountLoader();
      this.disposeAccountLoader = null;
    }

    this.ledger.close();
  }

  render() {
    const { intl, classes, ledgerStore } = this.injected;
    const { deviceId } = this.ledger;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backLink={{ route: onboardingAddAccountRoute }}>
          <FormattedMessage
            id="onboarding-ledger-account.title"
            description="Import a Ledger account screen title"
            defaultMessage="Import a Ledger account"
          />
        </ModalPaperHeader>
        {ledgerStore.hasBrowserSupport === false ? (
          <Grid
            container={true}
            className={classes.content}
            spacing={16}
          >
            <Grid item={true} xs={12}>
              <Typography
                children={intl.formatMessage(messages.unsupportedBrowser)}
              />
            </Grid>
          </Grid>
        ) : deviceId === null ? (
          <Grid
            container={true}
            className={classes.content}
            spacing={16}
          >
            <Grid item={true} xs={12}>
              <Typography
                children={intl.formatMessage(messages.connectInstructions)}
              />
            </Grid>
            <Grid item={true} xs={12}>
              <div className={classes.noPadding}>
                <LedgerConnectIllustration />
              </div>
            </Grid>
            <Grid item={true} xs={12}>
              <Typography
                children={intl.formatMessage(messages.statusConnecting)}
              />
            </Grid>
          </Grid>
        ) : (
          <List>
            {this.accounts.map((acc, idx) => (
              <ListItem
                key={acc.slot}
                divider={idx + 1 < this.accounts.length}
                button={true}
                onClick={() => this.confirmImport(acc)}
              >
                <ListItemAvatar>
                  <Avatar className={classes.accountAvatar}>
                    <AccountIcon size={24} address={acc.data ? acc.data.address : ''} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={intl.formatMessage(
                    messages.accountNrLabel,
                    { number: acc.slot + 1 }
                  )}
                  secondary={acc.data ? acc.data.address : '...'}
                />
              </ListItem>
            ))}
          </List>
        )}
      </ModalPaper>
    );
  }

  private async confirmImport(account: AccountData) {
    // TODO: Switch to account importing UI

    let success: boolean;
    try {
      success = await this.ledger.confirmAccount(account.slot);
    } catch (ex) {
      success = false;
    }

    if (success) {
      // TODO: Add account to store
    } else {
      // TODO: Switch back to account list
    }
  }

  private accountLoader = () => {
    const accountsToLoad = 5;
    const { walletStore } = this.injected;
    const { deviceId } = this.ledger;

    this.accounts = observable.array();
    if (deviceId === null) {
      return;
    }

    const importedAccounts = [...walletStore.accounts.values()]
      .filter(({ type }) => type === AccountType.LEDGER)
      .filter(({ hwId }) => hwId === deviceId);

    for (let slot = 0; this.accounts.length < accountsToLoad; slot++) {
      const isImported = importedAccounts
        .filter(({ hwSlot }) => hwSlot === slot)
        .length > 0;

      if (!isImported) {
        const acc = new AccountData(this.ledger, slot);
        this.accounts.push(acc);
      }
    }
  }
}

export default stylesDecorator(injectIntl(LedgerAccountPage));
