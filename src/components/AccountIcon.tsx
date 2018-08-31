import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import * as classNames from 'classnames';
import * as React from 'react';
import jdenticon from '../utils/jdenticon';

const riseIcon = require('../images/rise_icon.svg');

const styles = createStyles({
  root: {},
  placeholder: {
    opacity: 0.1
  }
});

interface Props extends WithStyles<typeof styles> {
  className?: string;
  size?: number;
  address: string;
}

const stylesDecorator = withStyles(styles, { name: 'AccountIcon' });

const AccountIcon = stylesDecorator(
  class extends React.Component<Props> {
    readonly svgElement = React.createRef<SVGSVGElement>();

    componentDidMount() {
      this.generateSvg();
    }

    componentDidUpdate() {
      this.generateSvg();
    }

    generateSvg() {
      const svgElement = this.svgElement.current;
      const { address } = this.props;
      if (svgElement) {
        jdenticon.update(svgElement, address, 0);
      }
    }

    render() {
      const { classes, address } = this.props;
      let size = this.props.size || 48;
      return (
        <div
          className={classNames(classes.root, this.props.className)}
          style={{
            width: size,
            height: size
          }}
          aria-hidden={true}
        >
          <svg
            ref={this.svgElement}
            style={
              !address
                ? {
                    display: 'none'
                  }
                : {}
            }
            width={size}
            height={size}
          />
          {!address && (
            <img
              className={classes.placeholder}
              src={riseIcon}
              alt="RISE icon"
              width={size}
              height={size}
            />
          )}
        </div>
      );
    }
  }
);

export default AccountIcon;
