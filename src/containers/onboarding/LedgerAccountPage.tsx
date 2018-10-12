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
  state = {
  };

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  render() {
    const { intl, classes } = this.injected;

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
      </ModalPaper>
    );
  }
}

export default stylesDecorator(injectIntl(LedgerAccountPage));
