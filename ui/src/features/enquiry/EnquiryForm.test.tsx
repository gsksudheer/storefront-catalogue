import { screen } from '@testing-library/react';
import { fail, mockApi, ok, product } from '../../test/mockApi';
import { renderRoute } from '../../test/render';

const p = product('1', { title: 'Classic Backpack' });

async function openEnquiry(extra: Parameters<typeof mockApi>[0] = {}) {
  const fetchMock = mockApi({ 'GET /api/catalogue/products/1': ok({ product: p }), ...extra });
  const view = renderRoute('/product/1');
  await view.user.click(await screen.findByRole('button', { name: /enquire about this product/i }));
  return { ...view, fetchMock };
}

describe('Enquiry', () => {
  it('GIVEN a product WHEN submitting contact details THEN sends the enquiry and shows "Thank you"', async () => {
    const { user, fetchMock } = await openEnquiry({
      'POST /api/enquiries': ok({ status: 'received', reference: 'AB12CD34' }),
    });

    expect(screen.getByLabelText(/name/i)).toHaveFocus();
    await user.type(screen.getByLabelText(/name/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Is it waterproof?');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    const thanks = await screen.findByRole('heading', { name: 'Thank you, Ada!' });
    expect(thanks).toHaveFocus();
    expect(screen.getByText('AB12CD34')).toBeInTheDocument();

    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(JSON.parse(post[1]!.body as string)).toEqual({
      productId: '1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'Is it waterproof?',
    });
  });

  it('validates required fields before sending anything', async () => {
    const { user, fetchMock } = await openEnquiry();
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(screen.getByText('Please enter your name')).toBeInTheDocument();
    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/name/i)).toHaveFocus();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('keeps the form and explains when the enquiry could not be sent', async () => {
    const { user } = await openEnquiry({
      'POST /api/enquiries': fail(503, 'ENQUIRY_NOT_SENT', 'We could not send your enquiry right now. Please try again.'),
    });
    await user.type(screen.getByLabelText(/name/i), 'Ada');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not send your enquiry/i);
    expect(screen.queryByText(/thank you/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('Ada');
  });

  it('shows server-side field errors next to the right field', async () => {
    const { user } = await openEnquiry({
      'POST /api/enquiries': fail(400, 'VALIDATION_ERROR', 'Invalid', [
        { field: 'email', message: 'Email domain not accepted' },
      ]),
    });
    await user.type(screen.getByLabelText(/name/i), 'Ada');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByText('Email domain not accepted')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('can be cancelled', async () => {
    const { user } = await openEnquiry();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: /enquire about this product/i })).toBeInTheDocument();
  });
});
