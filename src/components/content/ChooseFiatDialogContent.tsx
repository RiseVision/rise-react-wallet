import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import NativeSelect from '@material-ui/core/NativeSelect';
import Typography from '@material-ui/core/Typography';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import {
  FormattedMessage,
  defineMessages,
  InjectedIntlProps,
  injectIntl,
} from 'react-intl';
import { DialogContentProps, SetDialogContent } from '../Dialog';
import autoId from '../../utils/autoId';

const styles = (theme: Theme) => createStyles({
  content: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center'
  }
});

const stylesDecorator = withStyles(styles, { name: 'ChooseFiatDialogContent' });

const messages = defineMessages({
  dialogTitle: {
    id: 'choose-fiat-dialog-content.dialog-title',
    description: 'Choose FIAT dialog title',
    defaultMessage: 'Displayed FIAT currency'
  },
  instructions: {
    id: 'choose-fiat-dialog-content.instructions',
    description: 'Instructions before the fiat currency selection field',
    defaultMessage:
      'Select which FIAT currency you prefer to see your ' +
      'RISE account value in.'
  },
});

type BaseProps = WithStyles<typeof styles>
  & DialogContentProps;

interface Props extends BaseProps {
  onChange: (value: { fiat: string; global: boolean }) => void;
  fiat: string;
  options: string[];
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  fiat: string;
}

class ChooseFiatDialogContent extends React.Component<DecoratedProps, State> {
  @autoId dialogContentId: string;

  constructor(props: DecoratedProps) {
    super(props);

    const { fiat } = this.props;
    this.state = { fiat };
  }

  handleFiatChange = (ev: ChangeEvent<HTMLSelectElement>) => {
    const fiat = ev.target.value;
    this.setState({ fiat });
  }

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { onChange } = this.props;
    const { fiat } = this.state;
    onChange({
      fiat,
      global: false,
    });
  }

  handleUpdateForAllClick = () => {
    const { onChange } = this.props;
    const { fiat } = this.state;
    onChange({
      fiat,
      global: true,
    });
  }

  componentWillMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
      contentId: this.dialogContentId,
    });
  }

  render() {
    const { intl, classes, options } = this.props;

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleFormSubmit}
      >
        <Grid item={true} xs={12}>
          <Typography
            id={this.dialogContentId}
            children={intl.formatMessage(messages.instructions)}
          />
        </Grid>
        <Grid item={true} xs={12}>
          <NativeSelect
            autoFocus={true}
            value={this.state.fiat}
            onChange={this.handleFiatChange}
            fullWidth={true}
          >
            {options.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </NativeSelect>
        </Grid>
        <Grid item={true} xs={12} sm={6}>
          <Button type="submit" fullWidth={true}>
            <FormattedMessage
              id="choose-fiat-dialog-content.update-for-one"
              description="Update FIAT for one account button label"
              defaultMessage="Set for this account"
            />
          </Button>
        </Grid>
        <Grid item={true} xs={12} sm={6}>
          <Button
            onClick={this.handleUpdateForAllClick}
            fullWidth={true}
          >
            <FormattedMessage
              id="choose-fiat-dialog-content.update-for-all"
              description="Update FIAT for all accounts button label"
              defaultMessage="Set for all accounts"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(ChooseFiatDialogContent));
