import Grid from '@material-ui/core/Grid';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
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
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import {
  onboardingAddAccountRoute,
} from '../../routes';
import OnboardingStore from '../../stores/onboarding';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import { DposLedger, SupportedCoin, LedgerAccount } from 'dpos-ledger-api';

const styles = createStyles({
  content: {
    padding: 20,
    textAlign: 'center',
  },
  noPadding: {
    marginLeft: -20,
    marginRight: -20,
  },
});

interface Props extends WithStyles<typeof styles> {}

interface State {
  ledgerId: string | null;
}

type DecoratedProps = Props & InjectedIntlProps;

interface PropsInjected extends DecoratedProps {
  onboardingStore: OnboardingStore;
  routerStore: RouterStore;
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
  statusConnecting: {
    id: 'onboarding-ledger-account.status-connecting',
    description: 'Status text when attempting to connect to the Ledger device',
    defaultMessage: 'Trying to connect...',
  },
});

@inject('onboardingStore')
@inject('routerStore')
@observer
class LedgerAccountPage extends React.Component<DecoratedProps, State> {
  isMonitoring = false;
  state: State = {
    ledgerId: null,
  };

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  componentDidMount() {
    this.isMonitoring = true;
    this.pingDevice();
  }

  componentWillUnmount() {
    this.isMonitoring = false;
  }

  async pingDevice() {
    if (!this.isMonitoring) { return; }

    const checkAccount = new LedgerAccount().coinIndex(SupportedCoin.RISE);
    // @ts-ignore wrong d.ts
    const transport = await TransportU2F.create();
    transport.setExchangeTimeout(5000);
    if (!this.isMonitoring) { return; }

    const comm = new DposLedger(transport);
    try {
      const { publicKey } = await comm.getPubKey(checkAccount);
      const ledgerId = publicKey.slice(0, 8);

      if (this.isMonitoring) {
        this.setState({ ledgerId });
        setTimeout(() => this.pingDevice(), 1000);
      }
    } catch (ex) {
      if (this.isMonitoring) {
        this.setState({ ledgerId: null });
        setTimeout(() => this.pingDevice(), 1000);
      }

      if (ex.id === "U2F_5") {
        // Device not connected
      } else if (ex.statusCode === 0x6804) {
        // Device locked
      } else {
        // Unknown error
        throw ex;
      }
    }
  }

  render() {
    const { intl, classes } = this.injected;
    const { ledgerId } = this.state;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backLink={{ route: onboardingAddAccountRoute }}>
          <FormattedMessage
            id="onboarding-ledger-account.title"
            description="Import a Ledger account screen title"
            defaultMessage="Import a Ledger account"
          />
        </ModalPaperHeader>
        <Grid
          container={true}
          className={classes.content}
          spacing={16}
        >
          {ledgerId === null ? (
            <React.Fragment>
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
            </React.Fragment>
          ) : (
            <Grid item={true} xs={12}>
              <Typography children={ledgerId} />
            </Grid>
          )}
        </Grid>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(injectIntl(LedgerAccountPage));
