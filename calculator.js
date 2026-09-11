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

// Функция для сравнения дат без учета времени
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function isDateGreater(date1, date2) {
    return date1.getTime() > date2.getTime();
}

function isDateGreaterOrEqual(date1, date2) {
    return date1.getTime() >= date2.getTime();
}

function calculateBonds() {
    try {
        // Получаем все значения из формы
        const nominal = parseFloat(document.getElementById('nominal').value);
        const couponSize = parseFloat(document.getElementById('couponSize').value);
        const couponPeriod = parseInt(document.getElementById('couponPeriod').value);
        const taxRate = parseFloat(document.getElementById('taxRate').value) / 100;
        const purchasePricePercent = parseFloat(document.getElementById('purchasePrice').value) / 100;
        const initialInvestment = parseFloat(document.getElementById('initialInvestment').value);
        
        const couponDateStr = document.getElementById('couponDate').value;
        const maturityDateStr = document.getElementById('maturityDate').value;
        const purchaseDateStr = document.getElementById('purchaseDate').value;

        // Парсим даты корректно
        const couponDate = new Date(couponDateStr + 'T00:00:00');
        const maturityDate = new Date(maturityDateStr + 'T00:00:00');
        const purchaseDate = new Date(purchaseDateStr + 'T00:00:00');

        // Валидация данных
        if (!nominal || !couponSize || !couponPeriod || purchasePricePercent <= 0 || initialInvestment <= 0) {
            throw new Error('Пожалуйста, заполните все поля корректно');
        }

        if (isNaN(couponDate.getTime()) || isNaN(maturityDate.getTime()) || isNaN(purchaseDate.getTime())) {
            throw new Error('Пожалуйста, проверьте корректность дат');
        }

        // Начальный расчет
        const priceInRubles = nominal * purchasePricePercent; // Цена в рублях
        const initialBonds = Math.floor(initialInvestment / priceInRubles); // Количество облигаций

        // Массив для хранения результатов
        const results = [];
        let currentBonds = initialBonds;
        let totalCouponIncomeAfterTax = 0;
        let cumulativeInvested = initialInvestment;

        // Генерируем даты выплат купонов, начиная с первой выплаты
        let currentDate = new Date(couponDate);
        let paymentNumber = 0;
        
        while (isDateGreaterOrEqual(maturityDate, currentDate)) {
            // Выплата считается, если она происходит в день покупки или позже
            if (isDateGreaterOrEqual(currentDate, purchaseDate)) {
                const couponBeforeTax = currentBonds * couponSize;
                const tax = couponBeforeTax * taxRate;
                const couponAfterTax = couponBeforeTax - tax;
                
                // Капитализация - покупаем новые облигации на полученный купонный доход
                const bondsPurchased = Math.floor(couponAfterTax / priceInRubles);
                const remainingCash = couponAfterTax - (bondsPurchased * priceInRubles);
                
                results.push({
                    date: new Date(currentDate),
                    bondsBeforePayment: currentBonds,
                    couponBeforeTax: couponBeforeTax,
                    tax: tax,
                    couponAfterTax: couponAfterTax,
                    purchasePrice: priceInRubles,
                    bondsPurchased: bondsPurchased,
                    remainingCash: remainingCash
                });

                currentBonds += bondsPurchased;
                totalCouponIncomeAfterTax += couponAfterTax;
                cumulativeInvested += couponAfterTax;
            }

            // Переходим к следующей дате выплаты
            paymentNumber++;
            currentDate = new Date(couponDate.getTime() + paymentNumber * couponPeriod * 24 * 60 * 60 * 1000);
        }

        // Если нет результатов, возвращаем ошибку
        if (results.length === 0) {
            throw new Error('Нет выплат купонов между датой покупки и датой погашения. Пожалуйста, проверьте даты.');
        }

        // Расчет прибыли при погашении
        const maturityValue = currentBonds * nominal; // Полная стоимость облигаций при погашении
        const capitalGain = maturityValue - cumulativeInvested;
        const capitalGainTax = Math.max(0, capitalGain * taxRate); // Налог на прибыль от переоценки
        const capitalGainAfterTax = capitalGain - capitalGainTax;

        // Общий доход
        const totalIncome = totalCouponIncomeAfterTax + capitalGainAfterTax;

        // Отображение результатов
        displayResults(results, currentBonds, totalCouponIncomeAfterTax, capitalGainAfterTax, 
                      totalIncome, cumulativeInvested, maturityValue, capitalGain, capitalGainTax);

        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('errorMessage').style.display = 'none';

    } catch (error) {
        const errorEl = document.getElementById('errorMessage');
        errorEl.textContent = '❌ Ошибка: ' + error.message;
        errorEl.style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
        console.error('Ошибка расчета:', error);
    }
}

function displayResults(results, finalBonds, totalCouponIncome, capitalGainAfterTax, 
                       totalIncome, totalInvested, maturityValue, capitalGain, capitalGainTax) {
    // Очищаем таблицу
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    // Заполняем таблицу результатами
    results.forEach((row, index) => {
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
    successEl.textContent = `✅ Расчет выполнен успешно! Всего выплат купонов: ${results.length}`;
    successEl.style.display = 'block';
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
    
    // Автоматический расчет при загрузке страницы
    calculateBonds();
});
