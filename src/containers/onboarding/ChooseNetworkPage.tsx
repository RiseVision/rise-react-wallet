import Button from '@material-ui/core/Button';
import Radio from '@material-ui/core/es/Radio';
import TextField from '@material-ui/core/es/TextField';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import { FormEvent } from 'react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import * as lstore from 'store';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import { onboardingAddAccountRoute } from '../../routes';
import WalletStore, { NetworkType } from '../../stores/wallet';
import { isMainnet } from '../../utils/utils';

const styles = createStyles({
  languageList: {
    maxWidth: 320
  },
  titleIcon: {
    margin: '-4px 4px'
  }
});

interface Props extends WithStyles<typeof styles> {}

interface PropsInjected extends Props {
  walletStore: WalletStore;
  routerStore: RouterStore;
}

interface State {
  network: NetworkType;
  url?: string;
  urlError?: boolean;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingChooseLanguagePage'
});

@inject('walletStore')
@inject('routerStore')
@observer
class ChooseNetworkPage extends React.Component<Props, State> {
  state: State = {
    network: 'mainnet'
  };
  get injected(): PropsInjected {
    // @ts-ignore
    return this.props;
  }

  constructor(props: Props) {
    super(props);
    const { walletStore } = this.injected;
    const { type = null, url = null } = lstore.get('network') || {};
    // set from settings
    if (type) {
      this.state = {
        network: type,
        url
      };
    } else {
      // auto detect
      this.state.network = isMainnet(walletStore.config.domain)
        ? 'mainnet'
        : 'testnet';
    }
  }

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ network: event.target.value as NetworkType });
  };

  handleSetNetwork = (network: NetworkType) => () => {
    this.setState({ network });
  };

  handleCustomURL = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      url: event.target.value,
      urlError: false
    });
  };

  handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { routerStore, walletStore } = this.injected;
    const { url, network } = this.state;
    let error = false;
    if (network === 'custom') {
      try {
        const nethash = await walletStore.checkNodesNethash(url);
        if (!nethash) {
          throw new Error();
        }
      } catch {
        error = true;
      }
    }
    if (error) {
      this.setState({
        urlError: true
      });
    } else {
      walletStore.setNetwork(network, url);
      routerStore.goTo(onboardingAddAccountRoute);
    }
  };

  render() {
    const { network, url, urlError } = this.state;

    return (
      <ModalPaper open={true}>
        <form onSubmit={this.handleSubmit}>
          <ModalPaperHeader>
            <FormattedMessage
              id="onboarding-choose-network.title"
              description="Choose network screen title"
              defaultMessage="Choose network"
            />
          </ModalPaperHeader>
          <List>
            <ListItem button={true} onClick={this.handleSetNetwork('mainnet')}>
              <ListItemText>
                <Radio
                  name="network"
                  value="mainnet"
                  onChange={this.handleChange}
                  checked={network === 'mainnet'}
                />{' '}
                Main Net
              </ListItemText>
            </ListItem>
            <ListItem button={true} onClick={this.handleSetNetwork('testnet')}>
              <ListItemText>
                <Radio
                  name="network"
                  value="testnet"
                  onChange={this.handleChange}
                  checked={network === 'testnet'}
                />{' '}
                Test Net
              </ListItemText>
            </ListItem>
            <ListItem button={true}>
              <ListItemText onClick={this.handleSetNetwork('custom')}>
                <Radio
                  name="network"
                  value="custom"
                  onChange={this.handleChange}
                  checked={network === 'custom'}
                />{' '}
                <TextField
                  onFocus={this.handleSetNetwork('custom')}
                  label={
                    this.state.urlError ? (
                      <FormattedMessage
                        id="choose-network.url-error"
                        description="Custom URL text field error"
                        defaultMessage="Wrong URL"
                      />
                    ) : (
                      <FormattedMessage
                        id="choose-network.custom-url"
                        description="Custom URL text field label"
                        defaultMessage="Custom URL"
                      />
                    )
                  }
                  onChange={this.handleCustomURL}
                  error={urlError}
                  value={url}
                />
              </ListItemText>
            </ListItem>
            <ListItem>
              <Button type="submit" fullWidth={true}>
                <FormattedMessage
                  id="choose-network.submit-button"
                  description="Set network submit button"
                  defaultMessage="Set network"
                />
              </Button>
            </ListItem>
          </List>
        </form>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(ChooseNetworkPage);
