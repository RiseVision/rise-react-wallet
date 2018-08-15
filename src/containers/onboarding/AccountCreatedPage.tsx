import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import AccountIcon from '../../components/AccountIcon';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import { accountOverviewRoute, onboardingAddAccountRoute } from '../../routes';
import OnboardingStore from '../../stores/onboarding';
import RootStore from '../../stores/root';

const styles = createStyles({
  content: {
    padding: 20
  }
});

interface Props extends WithStyles<typeof styles> {
  store?: RootStore;
  onboardingStore?: OnboardingStore;
}

interface State {
  accountAddress: string;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingAccountCreatedPage'
});

@inject('store')
@inject('onboardingStore')
@observer
class AccountCreatedPage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { store, onboardingStore } = props;
    const accountAddress = onboardingStore!.address || '';
    this.state = {
      accountAddress,
    };
    if (!accountAddress) {
      store!.router.goTo(onboardingAddAccountRoute);
    }
  }

  handleOverviewClick = () => {
    const { store } = this.props;
    store!.router.goTo(accountOverviewRoute);
  }

  render() {
    const { classes } = this.props;
    const { accountAddress } = this.state;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader>
          <FormattedMessage
            id="onboarding-account-created.title"
            description="Account created screen title"
            defaultMessage="Your new account"
          />
        </ModalPaperHeader>
        <Grid
          container={true}
          className={classes.content}
          justify="center"
          spacing={16}
        >
          <Grid item={true} xs={12}>
            <Typography>
              <FormattedMessage
                id="onboarding-account-created.account-with-address-created"
                description="Text introducing the new account address"
                defaultMessage="A new acccount has been generated, with the following address:"
              />
            </Typography>
          </Grid>
          <Grid item={true} xs={12}>
            <Grid
              container={true}
              justify="center"
              alignItems="center"
              spacing={8}
            >
              <Grid item={true}>
                <Typography>{accountAddress}</Typography>
              </Grid>
              <Grid item={true}>
                <AccountIcon size={64} address={accountAddress} />
              </Grid>
            </Grid>
          </Grid>
          <Grid item={true} xs={12}>
            <Typography>
              <FormattedMessage
                id="onboarding-account-created.explain-image"
                description="Explain account image"
                defaultMessage={
                  `Every account gets an automatically generated image associated with it. This can ` +
                  `be used to double-check that the address was entered correctly when sending RISE.`
                }
              />
            </Typography>
          </Grid>
          <Grid item={true} xs={12}>
            <Button fullWidth={true} onClick={this.handleOverviewClick}>
              <FormattedMessage
                id="onboarding-account-created.continue"
                description="Continue button label"
                defaultMessage="Go to account overview"
              />
            </Button>
          </Grid>
        </Grid>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(AccountCreatedPage);
