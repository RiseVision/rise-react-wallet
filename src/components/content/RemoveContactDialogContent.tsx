import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import * as React from 'react';
import { FormEvent } from 'react';
import {
  FormattedMessage,
  defineMessages,
  injectIntl,
  InjectedIntlProps
} from 'react-intl';
import { DialogContentProps, SetDialogContent } from '../Dialog';
import autoId from '../../utils/autoId';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      maxWidth: 360,
      padding: theme.spacing.unit * 2,
      textAlign: 'center'
    }
  });

const stylesDecorator = withStyles(styles, {
  name: 'RemoveContactDialogContent'
});

type BaseProps = WithStyles<typeof styles> & DialogContentProps;

interface Props extends BaseProps {
  onConfirm: () => void;
  address: string;
  name: string;
}

type DecoratedProps = Props & InjectedIntlProps;

const messages = defineMessages({
  dialogTitle: {
    id: 'remove-contact-dialog-content.dialog-title',
    description: 'Remove contact dialog title',
    defaultMessage: 'Remove contact?'
  }
});

class RemoveContactDialogContent extends React.Component<DecoratedProps> {
  @autoId dialogContentId: string;

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
    const { onConfirm } = this.props;
    ev.preventDefault();

    onConfirm();
  }

  componentWillMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
      contentId: this.dialogContentId
    });
  }

  render() {
    const { classes, name, address } = this.props;

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleFormSubmit}
      >
        <Grid item={true} xs={12}>
          <Typography id={this.dialogContentId}>
            <FormattedMessage
              id="remove-contact-dialog-content.prompt-text-with-name"
              description="Prompt for contact removal form"
              defaultMessage={
                'Are you sure you want to remove {name} ({address}) ' +
                'from your address book?'}
              values={{ name, address }}
            />
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <Button type="submit" fullWidth={true} autoFocus={true}>
            <FormattedMessage
              id="remove-contact-dialog-content.remove-button"
              description="Label for remove contact button."
              defaultMessage="Remove contact"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(RemoveContactDialogContent));
