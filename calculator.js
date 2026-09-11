function formatCurrency(value) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatNumber(value) {
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value);
}

function formatDate(date) {
    return date.toLocaleDateString('ru-RU');
}

function calculateBonds() {
    try {
        // Получаем все значения из формы
        const nominal = parseFloat(document.getElementById('nominal').value);
        const couponSize = parseFloat(document.getElementById('couponSize').value);
        const couponPeriod = parseInt(document.getElementById('couponPeriod').value);
        const taxRate = parseFloat(document.getElementById('taxRate').value) / 100;
        const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) / 100;
        const initialInvestment = parseFloat(document.getElementById('initialInvestment').value);
        
        const couponDate = new Date(document.getElementById('couponDate').value);
        const maturityDate = new Date(document.getElementById('maturityDate').value);
        const purchaseDate = new Date(document.getElementById('purchaseDate').value);

        // Валидация данных
        if (!nominal || !couponSize || !couponPeriod || purchasePrice <= 0 || initialInvestment <= 0) {
            throw new Error('Пожалуйста, заполните все поля корректно');
        }

        // Начальный расчет
        const priceinRubles = nominal * purchasePrice; // Цена в рублях
        const initialBonds = Math.floor(initialInvestment / priceinRubles); // Количество облигаций
        const totalInitialInvestment = initialInvestment; // Общая инвестиция

        // Массив для хранения результатов
        const results = [];
        let currentBonds = initialBonds;
        let totalCouponIncomeAfterTax = 0;
        let totalInvested = initialInvestment;
        let cumulativeInvested = initialInvestment;

        // Генерируем даты выплат купонов
        let currentDate = new Date(couponDate);
        
        while (currentDate <= maturityDate) {
            if (currentDate > purchaseDate) { // Выплата только после покупки
                const couponBeforeTax = currentBonds * couponSize;
                const tax = couponBeforeTax * taxRate;
                const couponAfterTax = couponBeforeTax - tax;
                
                // Капитализация - покупаем новые облигации на полученный купонный доход
                const bondsPurchased = Math.floor(couponAfterTax / priceinRubles);
                const remainingCash = couponAfterTax - (bondsPurchased * priceinRubles);
                
                results.push({
                    date: new Date(currentDate),
                    bondsBeforePayment: currentBonds,
                    couponBeforeTax: couponBeforeTax,
                    tax: tax,
                    couponAfterTax: couponAfterTax,
                    purchasePrice: priceinRubles,
                    bondsPurchased: bondsPurchased,
                    remainingCash: remainingCash
                });

                currentBonds += bondsPurchased;
                totalCouponIncomeAfterTax += couponAfterTax;
                totalInvested += couponAfterTax;
                cumulativeInvested += couponAfterTax;
            }

            // Переходим к следующей дате выплаты
            currentDate = new Date(currentDate.getTime() + couponPeriod * 24 * 60 * 60 * 1000);
        }

        // Расчет прибыли при погашении
        const maturityValue = currentBonds * nominal; // Полная стоимость облигаций при погашении
        const purchasedValue = cumulativeInvested; // Сумма всех инвестиций
        const capitalGain = maturityValue - purchasedValue;
        const capitalGainTax = Math.max(0, capitalGain * taxRate); // Налог на прибыль от переоценки
        const capitalGainAfterTax = capitalGain - capitalGainTax;

        // Общий доход
        const totalIncome = totalCouponIncomeAfterTax + capitalGainAfterTax;

        // Отображение результатов
        displayResults(results, currentBonds, totalCouponIncomeAfterTax, capitalGainAfterTax, 
                      totalIncome, cumulativeInvested, maturityValue, capitalGain, capitalGainTax);

        document.getElementById('resultsSection').style.display = 'block';

    } catch (error) {
        const errorEl = document.getElementById('errorMessage');
        errorEl.textContent = '❌ Ошибка: ' + error.message;
        errorEl.style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
    }
}

function displayResults(results, finalBonds, totalCouponIncome, capitalGainAfterTax, 
                       totalIncome, totalInvested, maturityValue, capitalGain, capitalGainTax) {
    // Очищаем таблицу
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    // Заполняем таблицу результатами
    results.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(row.date)}</td>
            <td>${formatNumber(row.bondsBeforePayment)}</td>
            <td>${formatCurrency(row.couponBeforeTax)}</td>
            <td>${formatCurrency(row.tax)}</td>
            <td>${formatCurrency(row.couponAfterTax)}</td>
            <td>${formatCurrency(row.purchasePrice)}</td>
            <td>${formatNumber(row.bondsPurchased)}</td>
        `;
        tableBody.appendChild(tr);
    });

    // Обновляем сводку
    document.getElementById('finalBonds').textContent = formatNumber(finalBonds);
    document.getElementById('totalCouponIncome').textContent = formatCurrency(totalCouponIncome);
    document.getElementById('revaluationProfit').textContent = formatCurrency(capitalGainAfterTax);
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalInvestment').textContent = formatCurrency(totalInvested);
    document.getElementById('finalValue').textContent = formatCurrency(maturityValue);

    // Показываем сообщение об успехе
    const successEl = document.getElementById('successMessage');
    successEl.textContent = '✅ Расчет выполнен успешно!';
    successEl.style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
}

// Добавляем поддержку Enter для расчета
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateBonds();
            }
        });
    });
});
