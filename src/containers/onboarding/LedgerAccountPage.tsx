import Avatar from '@material-ui/core/es/Avatar';
import Grid from '@material-ui/core/es/Grid';
import List from '@material-ui/core/es/List';
import ListItem from '@material-ui/core/es/ListItem';
import ListItemAvatar from '@material-ui/core/es/ListItemAvatar';
import ListItemText from '@material-ui/core/es/ListItemText';
import {
  createStyles,
  withStyles,
  WithStyles
} from '@material-ui/core/es/styles';
import Typography from '@material-ui/core/es/Typography';
import { observable, runInAction, action } from 'mobx';
import { inject, observer } from 'mobx-react';
import RouterStore from '../../stores/router';
import React from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import AccountIcon from '../../components/AccountIcon';
import LedgerConfirmIllustration
  from '../../components/LedgerConfirmIllustration';
import LedgerConnectIllustration
  from '../../components/LedgerConnectIllustration';
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
  connectInstructionsV2: {
    id: 'onboarding-ledger-account.connect-instructions',
    description:
      'Text instructing the user to open the RISE app on their Ledger device',
    defaultMessage:
      'Connect your Ledger, open the RISE app and click Discover Device below.'
  },
  unsupportedBrowser: {
    id: 'onboarding-ledger-account.unsupported-browser',
    description:
      'Message when trying to use a browser that doesn\'t support Ledger devices',
    defaultMessage:
      'Your browser doesn\'t support using a Ledger device. If you wish to access this feature, ' +
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

@inject('onboardingStore')
@inject('routerStore')
@inject('walletStore')
@inject('ledgerStore')
@observer
class LedgerAccountPage extends React.Component<DecoratedProps> {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }
  accountsToShow: number = 5;
  private countdownId: null | number = null;

  @observable private selectedAccount: null | LedgerAccount = null;
  @observable private selectionTimeout: null | Date = null;
  @observable private countdownSeconds: number = 0;
  @observable
  private accounts = observable.array<LedgerAccount>(
    new Array(this.accountsToShow)
  );
  private loadingAccounts = false;

  // async componentWillMount() {
  //   const { ledgerStore } = this.injected;
  //
  //   // TODO call inside of a click handler
  //   await ledgerStore.open();
  // }

  componentWillUnmount() {
    this.injected.ledgerStore.close();
  }

  onDiscoverLedger = () => {
    this.injected.ledgerStore.open();
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
                children={intl.formatMessage(messages.connectInstructionsV2)}
              />
            </Grid>
            <Grid item={true} xs={12}>
              <div className={classes.noPadding}>
                <LedgerConnectIllustration onClick={this.onDiscoverLedger} />
              </div>
            </Grid>
            <Grid item={true} xs={12}>
              <Typography
                children={intl.formatMessage(messages.statusConnecting)}
              />
              {this.getConnectingHelpMsg()}
            </Grid>
          </Grid>
        ) : /* CONFIRM IMPORT */ selectedAccount !== null ? (
          <>
            <List>
              <ListItem key={selectedAccount.address} divider={true}>
                <ListItemAvatar>
                  <Avatar className={classes.accountAvatar}>
                    <AccountIcon
                      size={24}
                      address={selectedAccount ? selectedAccount.address : ''}
                    />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={intl.formatMessage(messages.accountNrLabel, {
                    number: selectedAccount.slot + 1
                  })}
                  secondary={selectedAccount ? selectedAccount.address : '...'}
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
          </>
        ) : (
          /* SELECT ACCOUNT */ <List>
            {this.accounts.map((data, index) => (
              <ListItem
                key={index}
                divider={index + 1 < this.accounts.length}
                button={true}
                onClick={() => this.confirmImport(data)}
              >
                <ListItemAvatar>
                  <Avatar className={classes.accountAvatar}>
                    <AccountIcon size={24} address={data ? data.address : ''} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={intl.formatMessage(messages.accountNrLabel, {
                    number: data ? data.slot + 1 : '...'
                  })}
                  secondary={data ? data.address : '...'}
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
  }

  private async confirmImport(account: LedgerAccount) {
    const { walletStore, routerStore, ledgerStore } = this.injected;
    const { device } = ledgerStore;

    if (account !== null) {
      const { address: accountAddress } = account;

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
            hwId: device!.vendorId.toString(),
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
  private async loadAccounts() {
    const { walletStore, ledgerStore } = this.injected;
    const { device } = ledgerStore;

    // wait for a ready transport
    if (!device) {
      return;
    }

    // run once
    if (this.loadingAccounts) {
      return;
    }

    this.loadingAccounts = true;
    this.selectedAccount = null;

    for (let slot = 0, index = 0; index < this.accountsToShow; slot++) {
      const data = await ledgerStore.getAccount(slot);
      const isImported = walletStore.accounts.has(data.address);

      if (isImported) {
        continue;
      }

      runInAction(() => {
        this.accounts[index] = data;
      });

      index++;
    }
  }
}

export default stylesDecorator(injectIntl(LedgerAccountPage));
