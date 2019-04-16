import Avatar from '@material-ui/core/Avatar';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { observable, runInAction, action } from 'mobx';
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
import LedgerConfirmIllustration from '../../components/LedgerConfirmIllustration';
import LedgerConnectIllustration from '../../components/LedgerConnectIllustration';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import { onboardingAddAccountRoute, accountOverviewRoute } from '../../routes';
import { AccountType } from '../../stores/account';
import LedgerStore, { LedgerAccount } from '../../stores/ledger';
import OnboardingStore from '../../stores/onboarding';
import WalletStore from '../../stores/wallet';

const styles = createStyles({
  content: {
    padding: 20,
    textAlign: 'center'
  },
  noPadding: {
    marginLeft: -20,
    marginRight: -20
  },
  accountAvatar: {
    backgroundColor: 'white'
  }
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
    description:
      'Text instructing the user to open the RISE app on their Ledger device',
    defaultMessage: 'Connect your Ledger & open the RISE app on it.'
  },
  unsupportedBrowser: {
    id: 'onboarding-ledger-account.unsupported-browser',
    description:
      "Message when trying to use a browser that doesn't support Ledger devices",
    defaultMessage:
      "Your browser doesn't support using a Ledger device. If you wish to access this feature, " +
      'you could try again with Google Chrome. It is a browser known to implement support for this.'
  },
  statusConnecting: {
    id: 'onboarding-ledger-account.status-connecting',
    description: 'Status text when attempting to connect to the Ledger device',
    defaultMessage: 'Trying to connect...'
  },
  statusConnectingHelpLink: {
    id: 'onboarding-ledger-account.status-connecting-help-link',
    description: 'Content of the link to the ledger support page',
    defaultMessage: 'visit the support page'
  },
  accountNrLabel: {
    id: 'onboarding-ledger-account.account-nr-label',
    description: 'Label for the account number available for import',
    defaultMessage: 'Account #{number}'
  },
  confirmInstructions: {
    id: 'onboarding-ledger-account.confirm-instructions',
    description:
      'Text instructing the user to confirm their address on their Ledger',
    defaultMessage: 'Please confirm the address above on your Ledger device.'
  },
  statusWaitingConfirmation: {
    id: 'onboarding-ledger-account.status-waiting-confirmation',
    description: 'Status text when waiting for user to confirm the account',
    defaultMessage:
      'Waiting for confirmation... ({seconds} {seconds, plural,' +
      '  one {second}' +
      '  other {seconds}' +
      '} remaining)'
  }
});

class AccountData {
  @observable data: null | LedgerAccount = null;

  constructor(ledgerStore: LedgerStore, readonly slot: number) {
    this.load(ledgerStore);
  }

  private async load(ledgerStore: LedgerStore) {
    try {
      const resp = await ledgerStore.getAccount(this.slot);
      runInAction(() => {
        this.data = resp;
      });
    } catch (ex) {
      // TODO debug remove
      console.log(ex);
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
  private countdownId: null | number = null;

  @observable private selectedAccount: null | AccountData = null;
  @observable private selectionTimeout: null | Date = null;
  @observable private countdownSeconds: number = 0;
  @observable private accounts = observable.array<AccountData>([]);
  private loadingAccounts = false;

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  // async componentWillMount() {
  //   const { ledgerStore } = this.injected;
  //
  //   // TODO call inside of a click handler
  //   await ledgerStore.open();
  // }

  componentWillUnmount() {
    this.injected.ledgerStore.close();
  }

  render() {
    const { intl, classes, ledgerStore } = this.injected;
    const { transport } = ledgerStore;
    const { selectedAccount, countdownSeconds } = this;

    this.loadAccounts();

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backLink={{ route: onboardingAddAccountRoute }}>
          <FormattedMessage
            id="onboarding-ledger-account.title"
            description="Import a Ledger account screen title"
            defaultMessage="Import a Ledger account"
          />
        </ModalPaperHeader>
        {/* NO SUPPORT */ ledgerStore.hasSupport === false ? (
          <Grid container={true} className={classes.content} spacing={16}>
            <Grid item={true} xs={12}>
              <Typography
                children={intl.formatMessage(messages.unsupportedBrowser)}
              />
            </Grid>
          </Grid>
        ) : /* SETUP THE DEVICE */ transport === null ? (
          <Grid container={true} className={classes.content} spacing={16}>
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
              {this.getConnectingHelpMsg()}
            </Grid>
          </Grid>
        ) : /* SELECT ACCOUNT */ selectedAccount !== null ? (
          <React.Fragment>
            <List>
              <ListItem key={selectedAccount.slot} divider={true}>
                <ListItemAvatar>
                  <Avatar className={classes.accountAvatar}>
                    <AccountIcon
                      size={24}
                      address={
                        selectedAccount.data ? selectedAccount.data.address : ''
                      }
                    />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={intl.formatMessage(messages.accountNrLabel, {
                    number: selectedAccount.slot + 1
                  })}
                  secondary={
                    selectedAccount.data ? selectedAccount.data.address : '...'
                  }
                />
              </ListItem>
            </List>
            <Grid container={true} className={classes.content} spacing={16}>
              <Grid item={true} xs={12}>
                <Typography
                  children={intl.formatMessage(messages.confirmInstructions)}
                />
              </Grid>
              <Grid item={true} xs={12}>
                <div className={classes.noPadding}>
                  <LedgerConfirmIllustration />
                </div>
              </Grid>
              <Grid item={true} xs={12}>
                <Typography
                  children={intl.formatMessage(
                    messages.statusWaitingConfirmation,
                    { seconds: countdownSeconds }
                  )}
                />
              </Grid>
            </Grid>
          </React.Fragment>
        ) : (
          /* CONFIRM IMPORT */ <List>
            {this.accounts.map((acc, idx) => (
              <ListItem
                key={acc.slot}
                divider={idx + 1 < this.accounts.length}
                button={true}
                onClick={() => this.confirmImport(acc)}
              >
                <ListItemAvatar>
                  <Avatar className={classes.accountAvatar}>
                    <AccountIcon
                      size={24}
                      address={acc.data ? acc.data.address : ''}
                    />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={intl.formatMessage(messages.accountNrLabel, {
                    number: acc.slot + 1
                  })}
                  secondary={acc.data ? acc.data.address : '...'}
                />
              </ListItem>
            ))}
          </List>
        )}
      </ModalPaper>
    );
  }

  getConnectingHelpMsg() {
    const { intl } = this.injected;
    return (
      <Typography>
        <FormattedMessage
          id="onboarding-ledger-account.status-connecting-help-v2"
          description="Link to the help page regarding Ledger connection problems"
          defaultMessage="In case of problems please {link}."
          values={{
            link: (
              <a
                href="https://support.ledger.com/hc/en-us/articles/115005165269-Fix-connection-issues"
                target="_blank"
              >
                {intl.formatMessage(messages.statusConnectingHelpLink)}
              </a>
            )
          }}
        />
      </Typography>
    );
  }

  private updateSelectionCountdown = () => {
    const now = new Date();
    const remainMs =
      this.selectionTimeout !== null
        ? this.selectionTimeout.getTime() - now.getTime()
        : 0;
    const isCountdownActive = remainMs > 0;

    runInAction(() => {
      if (isCountdownActive) {
        this.countdownSeconds = Math.ceil(remainMs / 1000);
      } else {
        // Make sure that the timeout clears the selected account
        this.selectedAccount = null;
      }
    });

    if (isCountdownActive && this.countdownId === null) {
      this.countdownId = window.setInterval(this.updateSelectionCountdown, 250);
    } else if (!isCountdownActive && this.countdownId !== null) {
      window.clearInterval(this.countdownId);
      this.countdownId = null;
    }
  };

  private async confirmImport(account: AccountData) {
    const { walletStore, routerStore, ledgerStore } = this.injected;
    const { device } = ledgerStore;

    if (account.data !== null) {
      const { address: accountAddress } = account.data;

      // Switch to account importing UI
      runInAction(() => {
        this.selectedAccount = account;
        this.selectionTimeout = new Date(new Date().getTime() + 25000);
        this.updateSelectionCountdown();
      });

      // Run the actual confirmation logic
      let success: boolean;
      try {
        success = await ledgerStore.confirmAccount(account.slot);
      } catch (ex) {
        success = false;
      }

      if (success && this.selectedAccount === account) {
        // login(...) and goTo(...) need to be called outside of runInAction, to avoid
        // weird order of execution and goTo(...) ending up being called before login(...)
        walletStore.login(
          accountAddress,
          {
            type: AccountType.LEDGER,
            // TODO check if `serialNumber` is ok
            hwId: device!.serialNumber,
            hwSlot: account.slot
          },
          true
        );
        routerStore.goTo(accountOverviewRoute, { id: accountAddress });
      } else {
        runInAction(() => {
          // Switch back to account list
          this.selectedAccount = null;
        });
      }
    }
  }

  /**
   * TODO move to LedgerStore
   */
  @action
  private loadAccounts = () => {
    const { walletStore, ledgerStore } = this.injected;

    // wait for a read transport
    if (!ledgerStore.transport) {
      return;
    }
    // only one thread
    if (this.loadingAccounts) {
      return;
    }
    this.loadingAccounts = true;

    debugger

    // TODO tmp
    // const accountsToLoad = 5;
    const accountsToLoad = 1;
    const { device } = ledgerStore;

    this.selectedAccount = null;
    // TODO dispose the previous one
    this.accounts = observable.array();
    if (device === null) {
      return;
    }

    const importedAccounts = [...walletStore.accounts.values()]
      .filter(({ type }) => type === AccountType.LEDGER)
      // TODO compare account IDs
      .filter(({ hwId }) => hwId === device.serialNumber);

    for (let slot = 0; this.accounts.length < accountsToLoad; slot++) {
      // TODO compare account IDs
      const isImported =
        importedAccounts.filter(({ hwSlot }) => hwSlot === slot).length > 0;

      if (!isImported) {
        const acc = new AccountData(ledgerStore, slot);
        this.accounts.push(acc);
      }
    }

    this.loadingAccounts = false;
  };
}

export default stylesDecorator(injectIntl(LedgerAccountPage));
