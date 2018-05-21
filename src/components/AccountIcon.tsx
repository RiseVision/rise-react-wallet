import * as React from 'react';
import * as classNames from 'classnames';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import jdenticon from '../utils/jdenticon';

const riseIcon = require('../images/rise_icon.svg');

type AccountIconClassKey =
  | 'root'
  | 'placeholder';

const stylesDecorator = withStyles<AccountIconClassKey>(
  {
    root: {
    },
    placeholder: {
      opacity: 0.1,
    },
  },
  { name: 'AccountIcon' }
);

interface Props {
  className?: string;
  size?: number;
  address: string;
}

type DecoratedProps = Props & WithStyles<AccountIconClassKey>;

const AccountIcon = stylesDecorator<Props>(
  class extends React.Component<DecoratedProps> {
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
          className={classNames(
            classes.root,
            this.props.className,
          )}
          style={{
            width: size,
            height: size,
          }}
        >
          <svg
            ref={this.svgElement}
            style={!address ? {
              display: 'none',
            } : {
            }}
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
