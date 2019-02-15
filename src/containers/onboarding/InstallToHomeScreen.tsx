import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { observer, inject } from 'mobx-react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import { onboardingAddAccountRoute } from '../../routes';
import WalletStore from '../../stores/wallet';

const styles = createStyles({
  content: {
    padding: 20
  },
  img: {
    textAlign: 'center'
  }
});

interface Props extends WithStyles<typeof styles> {}

interface PropsInjected extends Props {
  walletStore: WalletStore;
}

interface State {}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingInstallToHomeScreenPage'
});

@inject('walletStore')
@observer
class InstallToHomeScreen extends React.Component<Props, State> {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  handleInstall = () => {
    this.injected.walletStore.installA2HS();
  }

  render() {
    const { classes, walletStore } = this.injected;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader backLink={{ route: onboardingAddAccountRoute }}>
          <FormattedMessage
            id="onboarding-install.title"
            description="Install to Home Screen screen title"
            defaultMessage="Install to Home Screen"
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
                id="onboarding-install.info-main"
                description="Main info about installing app to homescreen"
                defaultMessage={
                  'You can install the wallet on your phone or OS via ' +
                  '"ADD TO HOME SCREEN" on iOS, Android and Chrome Desktop.'
                }
              />
            </Typography>
            <ul>
              <li>
                <Typography>
                  <FormattedMessage
                    id="onboarding-install.info-icon-location"
                    description="Info about the icon location"
                    defaultMessage={
                      'this will create an app icon on your phone\'s screen ' +
                      '/ desktop'
                    }
                  />
                </Typography>
              </li>
              <li>
                <Typography>
                  <FormattedMessage
                    id="onboarding-install.info-pwa-native-comparison"
                    description="Info comparing PWA and a native app"
                    defaultMessage={'the wallet will look like a regular app'}
                  />
                </Typography>
              </li>
              <li>
                <Typography>
                  <FormattedMessage
                    id="onboarding-install.info-no-appstore"
                    description="Info about appstores"
                    defaultMessage={
                      'you don\'t need to access AppStore / Play Store to do this'
                    }
                  />
                </Typography>
              </li>
              <li>
                <Typography>
                  <FormattedMessage
                    id="onboarding-install.info-offline"
                    description="Info about offline support"
                    defaultMessage={
                      'your data will be accessible even while offline'
                    }
                  />
                </Typography>
              </li>
              <li>
                <Typography>
                  <FormattedMessage
                    id="onboarding-install.info-separate-account"
                    description="Info about separate account"
                    defaultMessage={
                      'on iOS, accounts on the installed wallet will be ' +
                      'separate from the ones on the web'
                    }
                  />
                </Typography>
              </li>
            </ul>
            {walletStore.deferredInstallPrompt && (
              <Button
                type="submit"
                fullWidth={true}
                onClick={this.handleInstall}
              >
                <FormattedMessage
                  id="onboarding-install.install-button"
                  description="Install button label"
                  defaultMessage="Install"
                />
              </Button>
            )}
            {!walletStore.deferredInstallPrompt && (
              <React.Fragment>
                <Typography>
                  <FormattedMessage
                    id="onboarding-install.howto-ios"
                    description="Instruction on how to install the app on iOS"
                    defaultMessage={
                      'To install the app on an iPhone, click the "SHARE" ' +
                      'button at the bottom and then "ADD TO HOME SCREEN".'
                    }
                  />
                </Typography>
                <p className={classes.img}>
                  <img src="/a2hs-ios.png" style={{ maxWidth: '100%' }} />
                </p>
              </React.Fragment>
            )}
          </Grid>
        </Grid>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(InstallToHomeScreen);
