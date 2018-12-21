import { RadioGroup } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Radio from '@material-ui/core/es/Radio';
import TextField from '@material-ui/core/es/TextField';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import { onboardingAddAccountRoute } from '../../routes';
import LangStore from '../../stores/lang';
import { Locale } from '../../utils/i18n';

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
  langStore: LangStore;
  routerStore: RouterStore;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingChooseLanguagePage'
});

@inject('langStore')
@inject('routerStore')
@observer
class ChooseLanguagePage extends React.Component<Props> {
  get injected(): PropsInjected {
    // @ts-ignore
    return this.props;
  }

  handleLanguageClicked = async (locale: Locale) => {
    const { routerStore, langStore } = this.injected;
    await langStore.changeLanguage(locale);
    routerStore.goTo(onboardingAddAccountRoute);
  };

  render() {
    // const { classes } = this.injected;

    return (
      <ModalPaper open={true}>
        <form>
          <ModalPaperHeader>
            <FormattedMessage
              id="onboarding-choose-network.title"
              description="Choose network screen title"
              defaultMessage="Choose network"
            />
          </ModalPaperHeader>
          <RadioGroup
            aria-label="Network"
            /*
              className={classes.group}
              value={this.state.value}
              onChange={this.handleChange}
            */
          >
            <List>
              <ListItem button={true}>
                <ListItemText>
                  <Radio name="network" /> Main Net
                </ListItemText>
              </ListItem>
              <ListItem button={true}>
                <ListItemText>
                  <Radio name="network" /> Test Net
                </ListItemText>
              </ListItem>
              <ListItem button={true}>
                <ListItemText>
                  <Radio name="network" /> <TextField label="Custom node" />
                </ListItemText>
              </ListItem>
              <ListItem>
                <Button type="submit" fullWidth={true}>
                  <FormattedMessage
                    id="send-coins-dialog-content.send-button"
                    description="Send button label"
                    defaultMessage="Set network"
                  />
                </Button>
              </ListItem>
            </List>
          </RadioGroup>
        </form>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(ChooseLanguagePage);
