// Import your external dependencies
import React from 'react';
import PropTypes from 'prop-types';
import chai, { expect } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import { mount } from 'enzyme';

/* Enzyme Helpers that can mount and unmount React component instances to
 * the DOM and set `this.wrapper` and `this.dom` within Mocha's `this`
 * context [full source here](tests/enzyme-helpers.js). `this` can
 * only be referenced if inside `function () {}`.
 */
import { createMountNode, destroyMountNode } from '../enzyme-helpers';

// Import your internal dependencies (for example):
import Combobox from '../../components/combobox';
import Icon from '../../components/icon';
import filter from '~/components/combobox/filter';
import KEYS, { keyObjects } from '../../utilities/key-code';
import LETTERKEYS, { keyObjects as letterKeyObjects } from '../../utilities/letter-key-code';

/* Set Chai to use chaiEnzyme for enzyme compatible assertions:
 * https://github.com/producthunt/chai-enzyme
 */
chai.use(chaiEnzyme());

const accounts = [
	{ id: '1', label: 'Acme', subTitle: 'Account • San Francisco', type: 'account' },
	{ id: '2', label: 'Salesforce.com, Inc.', subTitle: 'Account • San Francisco', type: 'account' },
	{ id: '3', label: 'Paddy\'s Pub', subTitle: 'Account • Boston, MA', type: 'account' },
	{ id: '4', label: 'Tyrell Corp', subTitle: 'Account • San Francisco, CA', type: 'account' },
	{ id: '5', label: 'Paper St. Soap Company', subTitle: 'Account • Beloit, WI', type: 'account' },
	{ id: '6', label: 'Nakatomi Investments', subTitle: 'Account • Chicago, IL', type: 'account' },
	{ id: '7', label: 'Acme Landscaping', type: 'account' },
	{ id: '8', label: 'Acme Construction', subTitle: 'Account • Grand Marais, MN', type: 'account' }
];

const accountsWithIcon = accounts.map((elem) => Object.assign(elem, {
	icon: <Icon
		assistiveText="Account"
		category="standard"
		name={elem.type}
	/> })
);

const defaultProps = {
	id: 'combobox-unique-id',
	isInline: true,
	labels: {
		label: 'Search',
		placeholder: 'Search Salesforce'
	}
};

/* A re-usable demo component fixture outside of `describe` sections
 * can accept props within each test and be unmounted after each tests.
 * This wrapping component will be similar to your wrapping component
 * you will create in the React Storybook for manual testing.
 */
const DemoComponent = React.createClass({
	displayName: 'ComboboxDemoComponent',
	propTypes: {
		isOpen: PropTypes.bool
	},

	getDefaultProps () {
		return defaultProps;
	},

	getInitialState () {
		return {
			inputValue: '',
			selection: []
		};
	},

	render () {
		return (
			<Combobox
				events={{
					onChange: (event, { value }) => {
						this.setState({	inputValue: value });
					},
					onPillFocus: (event, data) => {
						console.log('testonPillFocus');
					},
					onRequestRemoveSelectedOption: (event, data) => {
						this.setState({
							inputValue: '',
							selection: data.selection
						});
					},
					onSubmit: (event, { value }) => {
						this.setState({
							inputValue: '',
							selection: [...this.state.selection, {
								label: value,
								icon: <Icon
									assistiveText="Account"
									category="standard"
									name="account"
								/> }] });
					},
					onSelect: (event, data) => {
						this.setState({
							inputValue: '',
							selection: data.selection
						});
					}
				}}
				options={filter({
					inputValue: this.state.inputValue,
					options: accountsWithIcon,
					selection: this.state.selection
				})}
				selection={this.state.selection}
				value={this.state.inputValue}
				{...this.props}
			/>
		);
	}
});

const getNodes = ({ wrapper }) => ({
	combobox: wrapper.find('.slds-combobox'),
	input: wrapper.find('.slds-combobox input'),
	menuListbox: wrapper.find('.slds-combobox .slds-listbox.slds-dropdown'),
	removeSingleItem: wrapper.find('.slds-combobox .slds-input__icon'),
	selectedListbox: wrapper.find(`#${defaultProps.id}-selected-listbox .slds-listbox`)
});

/* All tests for component being tested should be wrapped in a root `describe`,
 * which should be named after the component being tested.
 * When read aloud, the cumulative `describe` and `it` names should form a coherent
 * sentence, eg "Date Picker default structure and css is present with expected
 * attributes set". If you are having trouble constructing a cumulative short
 * sentence, this may be an indicator that your test is poorly structured.
 * String provided as first parameter names the `describe` section. Limit to nouns
 * as much as possible/appropriate.`
 */
describe('SLDSCombobox', function () {
	let mountNode;
	let wrapper;

	describe('Assistive technology and keyboard interactions', () => {
		/* Detect if presence of accessibility features such as ARIA
		 * roles and screen reader text is present in the DOM.
		 */
		beforeEach(() => {
			mountNode = createMountNode({ context: this });
		});

		afterEach(() => {
			destroyMountNode({ wrapper, mountNode });
		});

		it('has aria-haspopup, aria-expanded is false when closed, aria-expanded is true when open, ', function () {
			wrapper = mount(<DemoComponent multiple />, { attachTo: mountNode });
			const nodes = getNodes({ wrapper });
			expect(nodes.combobox.node.getAttribute('aria-haspopup')).to.equal('listbox');
			// closed
			expect(nodes.combobox.node.getAttribute('aria-expanded')).to.equal('false');
			// open
			nodes.input.simulate('click', {});
			expect(nodes.combobox.node.getAttribute('aria-expanded')).to.equal('true');
		});

		it('menu filters to second item, menu listbox menu item 2 aria-selected is true, input activedescendent has item 2 id, after pressing down arrow, enter selects item 2', function () {
			wrapper = mount(<DemoComponent multiple isOpen />, { attachTo: mountNode });
			let nodes = getNodes({ wrapper });
			nodes.input.simulate('focus');
			nodes.input.simulate('change', { target: { value: accounts[1].label } });
			nodes.input.simulate('keyDown', keyObjects.DOWN);
			expect(nodes.menuListbox.node.firstChild.firstChild.getAttribute('aria-selected')).to.equal('true');
			expect(nodes.input.node.getAttribute('aria-activedescendant')).to.equal(`${defaultProps.id}-listbox-option-2`);
			// select
			nodes.input.simulate('keyDown', keyObjects.ENTER);
			nodes = getNodes({ wrapper });
			expect(nodes.input.node.getAttribute('value')).to.equal('');
			expect(nodes.selectedListbox.find('.slds-pill__label').text()).to.equal(accounts[1].label);
		});


		// it('Selected Listbox: remove initial first pill, remove third initial item, cycles focus (first to last), removes last and initial fifth pill, cycles focus (last to first), remove inital second and fourth pill', function () {
		// 	wrapper = mount(<DemoComponent
		// 		multiple
		// 		selection={[accounts[0], accounts[1], accounts[2], accounts[3], accounts[4]]}
		// 	/>, { attachTo: mountNode });
		// 	const nodes = getNodes({ wrapper });
		// 	nodes.input.simulate('focus');
		// 	nodes.input.simulate('keyDown', keyObjects.TAB);
	
		// 	nodes.selectedListbox.children().at(0).childAt(0).simulate('keyDown', keyObjects.DELETE);

		// 	expect('test').to.equal('test');
		// });
	});

	describe('Variant-specific', () => {
		beforeEach(() => {
			mountNode = createMountNode({ context: this });
		});

		afterEach(() => {
			destroyMountNode({ wrapper, mountNode });
		});

		it('Limit to pre-defined choices', function () {
			wrapper = mount(<DemoComponent multiple predefinedOptionsOnly />, { attachTo: mountNode });
			let nodes = getNodes({ wrapper });
			nodes.input.simulate('focus');
			nodes.input.simulate('keyDown', letterKeyObjects.A);
			nodes.input.simulate('keyDown', keyObjects.ENTER);
			nodes = getNodes({ wrapper });
			expect(nodes.selectedListbox.node).to.be.an('undefined');
		});

		it('Inline Single Selection Remove selection', function () {
			wrapper = mount(<DemoComponent variant="inline-listbox" />, { attachTo: mountNode });
			let nodes = getNodes({ wrapper });

			// add selection
			nodes.input.simulate('focus');
			nodes.input.simulate('change', { target: { value: accounts[1].label } });
			nodes.input.simulate('keyDown', keyObjects.ENTER);
			expect(nodes.input.node.value).to.equal('Salesforce.com, Inc.');
			nodes = getNodes({ wrapper });

			// remove selection
			nodes.removeSingleItem.simulate('click');
			nodes = getNodes({ wrapper });
			expect(nodes.input.node.value).to.equal('');
		});
	});

	describe('Optional Props', () => {
		beforeEach(() => {
			mountNode = createMountNode({ context: this });
		});

		afterEach(() => {
			destroyMountNode({ wrapper, mountNode });
		});

		it('Displays No match found', function () {
			wrapper = mount(<DemoComponent isOpen />, { attachTo: mountNode });
			let nodes = getNodes({ wrapper });
			nodes.input.simulate('focus');
			nodes.input.simulate('change', { target: { value: 'Random text' } });
			// nodes.input.simulate('keyDown', keyObjects.ENTER);
			nodes = getNodes({ wrapper });
			expect(nodes.menuListbox.find('.slds-listbox__item.slds-listbox__status').text()).to.equal('No matches found.');
		});
	});
});
