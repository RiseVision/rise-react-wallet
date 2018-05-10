import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
import { withStyles, WithStyles } from 'material-ui/styles';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';
import AccountIcon from '../components/AccountIcon';

type OnboardingAccountCreatedPageClassKey =
  | 'content';

const stylesDecorator = withStyles<OnboardingAccountCreatedPageClassKey>(
  {
    content: {
      padding: 20,
    },
  },
  { name: 'OnboardingAccountCreatedPage' }
);

interface Props {
  accountAddress: string;
  onOpenOverview: () => void;
}

type DecoratedProps = Props & WithStyles<OnboardingAccountCreatedPageClassKey>;

const OnboardingAccountCreatedPage = stylesDecorator<Props>(
  class extends React.Component<DecoratedProps> {
    handleOverviewClick = () => {
      this.props.onOpenOverview();
    }

    render() {
      const { classes, accountAddress } = this.props;

      return (
        <ModalPaper>
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
                A new acccount has been generated, with the following address:
              </Typography>
            </Grid>
            <Grid item={true} xs={12}>
              <Grid container={true} justify="center" alignItems="center" spacing={8}>
                <Grid item={true}>
                  <AccountIcon size={64} address={accountAddress} />
                </Grid>
                <Grid item={true}>
                  <Typography>{accountAddress}</Typography>
                </Grid>
              </Grid>
            </Grid>
            <Grid item={true} xs={12}>
              <Typography>
                Every account gets an automatically generated image associated with it. This can be used to
                double-check that the address was entered correctly when sending RISE.
              </Typography>
            </Grid>
            <Grid item={true} xs={12}>
              <Button fullWidth={true} onClick={this.handleOverviewClick}>
                Go to account overview
              </Button>
            </Grid>
          </Grid>
        </ModalPaper>
      );
    }
  }
);

export default OnboardingAccountCreatedPage;
