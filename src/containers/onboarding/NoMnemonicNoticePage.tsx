import Button from '@material-ui/core/es/Button';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/es/styles';
import Typography from '@material-ui/core/es/Typography';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import Link from '../../components/Link';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import { accountOverviewNoIDRoute } from '../../routes';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: 20
    },
    text: {
      marginTop: 10,
      '&:first-child': {
        marginTop: 0
      }
    },
    button: {
      marginTop: 10
    }
  });

interface Props extends WithStyles<typeof styles> {
  routerStore?: RouterStore;
}

interface PropsInjected extends Props {
  routerStore: RouterStore;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingSecurityNoticePage'
});

@inject('routerStore')
@observer
class NoMnemonicNoticePage extends React.Component<Props> {
  get injected(): PropsInjected {
    // @ts-ignore
    return this.props;
  }

  render() {
    const { classes } = this.injected;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader closeLink={{ route: accountOverviewNoIDRoute }}>
          <FormattedMessage
            id="onboarding-no-mnemonic-notice.title"
            description="No passphrase notice screen title"
            defaultMessage="Your account was added"
          />
        </ModalPaperHeader>
        <div className={classes.content}>
          <Typography className={classes.text}>
            <FormattedMessage
              id="onboarding-no-mnemonic-notice.did-you-notice"
              description="Notice about asking for the passphrase only when making transactions"
              defaultMessage={
                'Did you notice that you didn\'t have to enter your passphrase? ' +
                'That\'s because you will only need to enter your mnemonic passphrase ' +
                'when you\'re about to make a transaction.'
              }
            />
          </Typography>
          <Typography className={classes.text}>
            <FormattedMessage
              id="onboarding-no-mnemonic-notice.written-down-mnemonic"
              description="Reminder to have the passphrase written down"
              defaultMessage={
                'Please make sure that your passphrase is written down securely ' +
                'so that you wouldn\'t forget it as it is usually not needed often.'
              }
            />
          </Typography>
          <Link route={accountOverviewNoIDRoute}>
            <Button className={classes.button} fullWidth={true}>
              <FormattedMessage
                id="onboarding-no-mnemonic-notice.continue"
                description="Continue button label"
                defaultMessage="Go to account overview"
              />
            </Button>
          </Link>
        </div>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(NoMnemonicNoticePage);
